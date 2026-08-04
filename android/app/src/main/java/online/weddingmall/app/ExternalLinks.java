package online.weddingmall.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.widget.Toast;

import java.net.URISyntaxException;

/**
 * Hands a link that is not part of the website to whichever app owns it.
 *
 * Capacitor's own {@code Bridge.launchIntent} already does this for off-origin
 * https links, but it passes the URI's host to the allow-list matcher, and for
 * {@code tel:}, {@code mailto:} and {@code upi:} there is no host at all. It
 * also swallows {@link ActivityNotFoundException} without a word, so a user with
 * no dialler or no UPI app installed just sees nothing happen. Non-http schemes
 * are therefore routed through here instead.
 */
final class ExternalLinks {

    private ExternalLinks() {}

    /**
     * @return always true — the caller has handed the URL off, so the WebView
     *         must not try to load it itself.
     */
    static boolean open(Activity activity, Uri uri) {
        String scheme = uri.getScheme();

        // Payment gateways hand back `intent://…#Intent;…;end` URLs that name a
        // target package and carry a browser fallback for when it is missing.
        if ("intent".equals(scheme)) {
            return openIntentUri(activity, uri);
        }

        return start(activity, new Intent(Intent.ACTION_VIEW, uri));
    }

    private static boolean openIntentUri(Activity activity, Uri uri) {
        Intent intent;
        try {
            intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
        } catch (URISyntaxException e) {
            toast(activity);
            return true;
        }

        // Anything parsed out of page content is untrusted: without this an
        // `intent:` URL could name one of our own non-exported components and
        // reach it with attacker-chosen extras.
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        intent.setComponent(null);
        intent.setSelector(null);

        if (start(activity, intent, false)) return true;

        String fallback = intent.getStringExtra("browser_fallback_url");
        if (fallback != null && (fallback.startsWith("https://") || fallback.startsWith("http://"))) {
            return start(activity, new Intent(Intent.ACTION_VIEW, Uri.parse(fallback)));
        }

        toast(activity);
        return true;
    }

    private static boolean start(Activity activity, Intent intent) {
        return start(activity, intent, true);
    }

    private static boolean start(Activity activity, Intent intent, boolean complain) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            activity.startActivity(intent);
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            if (complain) toast(activity);
            return false;
        }
    }

    private static void toast(Activity activity) {
        Toast.makeText(activity, R.string.external_no_app, Toast.LENGTH_SHORT).show();
    }
}
