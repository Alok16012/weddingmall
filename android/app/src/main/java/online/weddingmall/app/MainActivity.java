package online.weddingmall.app;

import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

/**
 * The whole app: a hardened WebView pointed at https://weddingmall.online, plus
 * the few things a browser tab cannot do for itself — a splash, an offline
 * screen, the hardware back button, and downloads.
 *
 * Nothing about the site is reimplemented here. Sessions, routing, the vendor
 * and admin panels and the biodata maker are all the same code the web serves,
 * which is what lets a web deploy update the app with no new release.
 */
public class MainActivity extends BridgeActivity {

    private AppChrome chrome;
    private Downloads downloads;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Bridge bridge = getBridge();
        WebView webView = bridge.getWebView();

        // White rather than the default black, so a slow first paint reads as
        // the page still loading instead of the app having died.
        webView.setBackgroundColor(Color.WHITE);
        harden(webView.getSettings());

        // BridgeActivity's own layout is the first child of the content frame;
        // the insets belong on it, not on the frame, which also holds the
        // overlay AppChrome is about to add.
        ViewGroup content = findViewById(android.R.id.content);
        View webRoot = content.getChildAt(0);

        chrome = new AppChrome(this);
        chrome.setOnRetry(this::retry);
        chrome.applyInsets(webRoot);

        downloads = new Downloads(this, webView);
        bridge.setWebViewClient(new AppWebViewClient(bridge, this, chrome, downloads));

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (chrome.isOfflineVisible() || !webView.canGoBack()) {
                    finish();
                    return;
                }
                webView.goBack();
            }
        });
    }

    /**
     * Everything the WebView can do that this app has no use for.
     *
     * The page is remote and trusted only in the sense that we serve it; denying
     * local file and cross-origin file access means a redirect to somewhere
     * unexpected still cannot read the app's own storage.
     */
    private static void harden(WebSettings settings) {
        settings.setAllowFileAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setSaveFormData(false);
        // No location permission is declared, so a prompt could only ever end in
        // a denial — better that the site's fallback runs immediately.
        settings.setGeolocationEnabled(false);
    }

    /** The offline screen's Retry button. */
    private void retry() {
        if (!isOnline()) {
            chrome.reportStillOffline();
            return;
        }

        chrome.showLoading();

        WebView webView = getBridge().getWebView();
        String current = webView.getUrl();
        // After a failed load the WebView may be sitting on its own error page,
        // which is not something reload() can usefully repeat.
        if (current == null || !current.startsWith("http")) {
            webView.loadUrl(getBridge().getServerUrl());
        } else {
            webView.reload();
        }
    }

    private boolean isOnline() {
        ConnectivityManager manager =
            (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        if (manager == null) return true;

        Network network = manager.getActiveNetwork();
        if (network == null) return false;

        NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
        return capabilities != null
            && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    @Override
    public void onRequestPermissionsResult(
        int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        // Capacitor owns the camera prompt for file uploads; storage is ours.
        if (downloads != null && downloads.onRequestPermissionsResult(requestCode, grantResults)) {
            return;
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
}
