package online.weddingmall.app;

import android.app.Activity;
import android.graphics.Bitmap;
import android.net.Uri;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

/**
 * Decides what the splash and offline screens do, and where off-site links go.
 *
 * Capacitor's own client reports every failed request to its listeners without
 * checking {@link WebResourceRequest#isForMainFrame()}, so one analytics beacon
 * or one missing thumbnail would be enough to throw an offline screen over a
 * page that had loaded perfectly well. Only a main-frame failure counts here.
 */
final class AppWebViewClient extends BridgeWebViewClient {

    private final Activity activity;
    private final AppChrome chrome;
    private final Downloads downloads;

    private boolean mainFrameFailed;

    AppWebViewClient(Bridge bridge, Activity activity, AppChrome chrome, Downloads downloads) {
        super(bridge);
        this.activity = activity;
        this.chrome = chrome;
        this.downloads = downloads;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        String scheme = url != null ? url.getScheme() : null;

        // http(s) is the site itself plus off-origin links Capacitor already
        // matches against `server.allowNavigation`; everything else — tel,
        // mailto, upi, whatsapp, geo, intent — belongs to another app.
        if (scheme != null && !"http".equals(scheme) && !"https".equals(scheme)) {
            return ExternalLinks.open(activity, url);
        }

        return super.shouldOverrideUrlLoading(view, request);
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        mainFrameFailed = false;
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);

        if (mainFrameFailed) {
            chrome.showOffline();
            return;
        }

        chrome.hideOffline();
        chrome.hideSplash();
        downloads.injectShim();
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        super.onReceivedError(view, request, error);
        if (request.isForMainFrame()) mainFrameFailed = true;
    }

    @Override
    public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
        super.onReceivedHttpError(view, request, response);

        // A 4xx/5xx that still returns a page is the site talking, not a dead
        // connection — only a hard server failure is worth the offline screen.
        if (request.isForMainFrame() && response.getStatusCode() >= 500) {
            mainFrameFailed = true;
        }
    }
}
