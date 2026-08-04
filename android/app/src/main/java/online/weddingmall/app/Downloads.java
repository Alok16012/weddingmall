package online.weddingmall.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.text.TextUtils;
import android.util.Base64;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.security.SecureRandom;

/**
 * Saves files the website hands to the user — biodata PDFs above all — into the
 * device's Downloads folder.
 *
 * There are two routes, because the web app produces two kinds of link:
 *
 *   - A normal http(s) URL fires the WebView's {@link android.webkit.DownloadListener}
 *     and goes to {@link DownloadManager}, cookies and all, so the download
 *     survives the app being backgrounded.
 *
 *   - A `blob:` URL does not. The WebView never notifies anyone about blob
 *     downloads, and {@code Bridge.launchIntent} explicitly refuses them, so an
 *     `<a download href="blob:…">` — exactly what `src/modules/biodata/pdf.ts`
 *     builds — would silently do nothing in the app. The shim below catches the
 *     click in the page, reads the blob back out, and passes the bytes over a
 *     JavaScript interface to be written natively.
 *
 * The interface is reachable from any frame the WebView loads, so it is gated on
 * a per-launch random token that only the injected script knows. A third-party
 * iframe cannot read the main frame's script, so it cannot call in.
 */
final class Downloads {

    private static final String TAG = "WMDownloads";
    private static final String BRIDGE_NAME = "WMDownloader";
    private static final int REQUEST_STORAGE = 9731;

    /** ~24 MB of file. Comfortably above any biodata PDF, and bounded. */
    private static final int MAX_BASE64_CHARS = 32 * 1024 * 1024;

    private final Activity activity;
    private final WebView webView;
    private final String token;

    private Runnable pendingWrite;

    Downloads(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;

        byte[] seed = new byte[16];
        new SecureRandom().nextBytes(seed);
        this.token = Base64.encodeToString(seed, Base64.NO_WRAP | Base64.URL_SAFE);

        webView.setDownloadListener(this::onDownloadStart);
        webView.addJavascriptInterface(new JsBridge(), BRIDGE_NAME);
    }

    // ------------------------------------------------------------ page shim

    /** Re-injected on every page load; the guard makes a double call harmless. */
    void injectShim() {
        webView.evaluateJavascript(
            "(function(){" +
            "if(window.__wmDownloadShim)return;window.__wmDownloadShim=1;" +
            "var T='" + token + "';" +
            "function send(b,name){var fr=new FileReader();" +
            "fr.onerror=function(){" + BRIDGE_NAME + ".failed(T);};" +
            "fr.onload=function(){var s=String(fr.result),i=s.indexOf(',');" +
            BRIDGE_NAME + ".save(T,s.slice(i+1),name,b.type||'application/octet-stream');};" +
            "fr.readAsDataURL(b);}" +
            "document.addEventListener('click',function(e){" +
            "var a=e.target&&e.target.closest&&e.target.closest('a[download]');if(!a)return;" +
            "var href=a.getAttribute('href')||'';" +
            "if(href.lastIndexOf('blob:',0)!==0&&href.lastIndexOf('data:',0)!==0)return;" +
            "e.preventDefault();e.stopPropagation();" +
            "var name=a.getAttribute('download')||'download';" +
            "fetch(href).then(function(r){return r.blob()}).then(function(b){send(b,name)})" +
            ".catch(function(){" + BRIDGE_NAME + ".failed(T);});" +
            "},true);})();",
            null
        );
    }

    private final class JsBridge {

        @android.webkit.JavascriptInterface
        public void save(String callerToken, String base64, String filename, String mime) {
            if (!token.equals(callerToken)) return;
            if (base64 == null || base64.length() > MAX_BASE64_CHARS) {
                report(R.string.download_failed, null);
                return;
            }
            String name = safeName(filename, mime);
            withStoragePermission(() -> new Thread(() -> {
                byte[] bytes;
                try {
                    bytes = Base64.decode(base64, Base64.DEFAULT);
                } catch (IllegalArgumentException e) {
                    report(R.string.download_failed, null);
                    return;
                }
                write(bytes, name, mime);
            }, "wm-download").start());
        }

        @android.webkit.JavascriptInterface
        public void failed(String callerToken) {
            if (!token.equals(callerToken)) return;
            report(R.string.download_failed, null);
        }
    }

    // --------------------------------------------------------- native route

    private void onDownloadStart(String url, String userAgent, String disposition, String mime, long size) {
        String name = safeName(URLUtil.guessFileName(url, disposition, mime), mime);

        if (URLUtil.isNetworkUrl(url)) {
            withStoragePermission(() -> enqueue(url, userAgent, name, mime));
            return;
        }

        // A blob: link that reached the DownloadListener instead of the shim —
        // it can still be read from the page.
        if (url != null && url.startsWith("blob:")) {
            injectShim();
            return;
        }

        report(R.string.download_failed, null);
    }

    private void enqueue(String url, String userAgent, String name, String mime) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setMimeType(mime);
            request.setTitle(name);
            request.setDescription(activity.getString(R.string.app_name));
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
            if (!TextUtils.isEmpty(userAgent)) request.addRequestHeader("User-Agent", userAgent);

            // Anything behind the session — a vendor's uploaded document — needs
            // the WebView's cookies to come along.
            String cookie = CookieManager.getInstance().getCookie(url);
            if (!TextUtils.isEmpty(cookie)) request.addRequestHeader("Cookie", cookie);

            DownloadManager manager =
                (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) throw new IllegalStateException("no DownloadManager");
            manager.enqueue(request);
            report(R.string.download_started, name);
        } catch (RuntimeException e) {
            Log.w(TAG, "enqueue failed", e);
            report(R.string.download_failed, null);
        }
    }

    private void write(byte[] bytes, String name, String mime) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                writeViaMediaStore(bytes, name, mime);
            } else {
                writeToPublicDir(bytes, name, mime);
            }
            report(R.string.download_saved, name);
        } catch (IOException | RuntimeException e) {
            Log.w(TAG, "write failed", e);
            report(R.string.download_failed, null);
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private void writeViaMediaStore(byte[] bytes, String name, String mime) throws IOException {
        ContentResolver resolver = activity.getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, name);
        values.put(MediaStore.Downloads.MIME_TYPE, mime);
        values.put(MediaStore.Downloads.IS_PENDING, 1);

        Uri item = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (item == null) throw new IOException("MediaStore refused " + name);

        try (OutputStream out = resolver.openOutputStream(item)) {
            if (out == null) throw new IOException("no stream for " + name);
            out.write(bytes);
        }

        values.clear();
        values.put(MediaStore.Downloads.IS_PENDING, 0);
        resolver.update(item, values, null, null);
    }

    private void writeToPublicDir(byte[] bytes, String name, String mime) throws IOException {
        File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!dir.exists() && !dir.mkdirs()) throw new IOException("cannot create " + dir);

        File file = new File(dir, name);
        for (int n = 1; file.exists() && n < 100; n++) {
            file = new File(dir, suffixed(name, n));
        }

        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(bytes);
        }
        MediaScannerConnection.scanFile(
            activity, new String[] { file.getAbsolutePath() }, new String[] { mime }, null);
    }

    // ------------------------------------------------------------ permission

    /**
     * From API 29 the Downloads collection is writable without a permission, so
     * only older devices ever see a prompt — and only at the moment they first
     * download something, not on launch.
     */
    private void withStoragePermission(Runnable work) {
        // Hops to the UI thread first: `save` arrives on a binder thread, and
        // requestPermissions may only be called from the main thread.
        activity.runOnUiThread(() -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                || ContextCompat.checkSelfPermission(activity, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    == PackageManager.PERMISSION_GRANTED) {
                work.run();
                return;
            }
            pendingWrite = work;
            ActivityCompat.requestPermissions(
                activity, new String[] { Manifest.permission.WRITE_EXTERNAL_STORAGE }, REQUEST_STORAGE);
        });
    }

    /** @return true when this was our request and the host should not pass it on. */
    boolean onRequestPermissionsResult(int requestCode, int[] grantResults) {
        if (requestCode != REQUEST_STORAGE) return false;

        Runnable work = pendingWrite;
        pendingWrite = null;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            if (work != null) activity.runOnUiThread(work);
        } else {
            report(R.string.download_permission_needed, null);
        }
        return true;
    }

    // ---------------------------------------------------------------- naming

    /**
     * The filename comes from the page, so it is treated as hostile: no path
     * separators, no traversal, no leading dot, and a length a filesystem will
     * accept.
     */
    private static String safeName(String raw, String mime) {
        String name = raw == null ? "" : raw.trim();
        name = name.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_");
        while (name.startsWith(".")) name = name.substring(1);
        if (name.isEmpty()) name = "download";
        if (name.length() > 120) name = name.substring(0, 120);

        if (!name.contains(".")) {
            String extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mime);
            if (extension != null) name = name + "." + extension;
        }
        return name;
    }

    private static String suffixed(String name, int n) {
        int dot = name.lastIndexOf('.');
        if (dot <= 0) return name + " (" + n + ")";
        return name.substring(0, dot) + " (" + n + ")" + name.substring(dot);
    }

    private void report(int stringRes, String argument) {
        activity.runOnUiThread(() -> {
            String message = argument == null
                ? activity.getString(stringRes)
                : activity.getString(stringRes, argument);
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show();
        });
    }
}
