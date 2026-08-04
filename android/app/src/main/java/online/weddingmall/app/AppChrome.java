package online.weddingmall.app;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

/**
 * Everything the user sees that is not the web page: the splash that holds the
 * screen until the site has actually rendered, the offline screen, and the
 * colour behind the system bars.
 *
 * These are built in code rather than in a layout because the whole point of the
 * wrapper is that the UI lives on the website; a handful of views that only ever
 * appear when the website cannot is not worth a second place to keep the brand
 * in sync. The colours all come from `colors.xml`, which mirrors the web tokens.
 *
 * The overlay is added with {@link Activity#addContentView}, so it sits above
 * Capacitor's WebView. It is not clickable itself — only the splash and offline
 * panels are — so touches fall through to the page whenever both are hidden.
 */
final class AppChrome {

    private static final int FADE_MS = 220;

    private final Activity activity;
    private final View splash;
    private final View offline;
    private final TextView offlineMessage;
    private final View statusScrim;
    private final View navigationScrim;

    private Runnable onRetry = () -> {};

    AppChrome(Activity activity) {
        this.activity = activity;

        splash = buildSplash();
        offline = buildOffline();
        offlineMessage = offline.findViewWithTag("message");
        offline.setVisibility(View.GONE);

        // Android 15 ignores android:statusBarColor, so the bars are painted
        // here instead and sized from the real insets in applyInsets().
        statusScrim = new View(activity);
        statusScrim.setBackgroundColor(colour(R.color.statusBar));
        navigationScrim = new View(activity);
        navigationScrim.setBackgroundColor(colour(R.color.navigationBar));

        FrameLayout overlay = new FrameLayout(activity);
        overlay.addView(splash, fill());
        overlay.addView(offline, fill());
        overlay.addView(statusScrim, new FrameLayout.LayoutParams(MATCH, 0, Gravity.TOP));
        overlay.addView(navigationScrim, new FrameLayout.LayoutParams(MATCH, 0, Gravity.BOTTOM));

        activity.addContentView(overlay, new ViewGroup.LayoutParams(MATCH, MATCH));
    }

    /**
     * Keeps the web page clear of the system bars and sizes the bar scrims.
     *
     * Applied to the WebView's container, never to the whole content view: the
     * scrims have to stay at the window edges, behind the bars they are standing
     * in for, while the page is inset away from them.
     */
    void applyInsets(View webRoot) {
        ViewCompat.setOnApplyWindowInsetsListener(webRoot, (view, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
            resize(statusScrim, bars.top);
            // While the keyboard is up it covers the navigation bar, so a scrim
            // there would just be a white band under the keys.
            resize(navigationScrim, ime.bottom > 0 ? 0 : bars.bottom);
            return insets;
        });
        ViewCompat.requestApplyInsets(webRoot);
    }

    void setOnRetry(Runnable retry) {
        this.onRetry = retry;
    }

    /** Called once the site has rendered; a no-op afterwards. */
    void hideSplash() {
        if (splash.getVisibility() != View.VISIBLE) return;
        splash.animate().alpha(0f).setDuration(FADE_MS).withEndAction(() -> {
            splash.setVisibility(View.GONE);
            splash.setAlpha(1f);
        });
    }

    /** Shown while a retry is in flight, and behind the very first page load. */
    void showLoading() {
        offline.setVisibility(View.GONE);
        splash.setAlpha(1f);
        splash.setVisibility(View.VISIBLE);
    }

    void showOffline() {
        splash.setVisibility(View.GONE);
        splash.setAlpha(1f);
        offlineMessage.setText(R.string.offline_message);
        offline.setVisibility(View.VISIBLE);
    }

    void hideOffline() {
        offline.setVisibility(View.GONE);
    }

    boolean isOfflineVisible() {
        return offline.getVisibility() == View.VISIBLE;
    }

    /** Feedback for a retry that could not even reach the network. */
    void reportStillOffline() {
        offlineMessage.setText(R.string.offline_still_offline);
        offline.setVisibility(View.VISIBLE);
    }

    // ---------------------------------------------------------------- views

    private View buildSplash() {
        LinearLayout box = column();
        box.setBackgroundColor(colour(R.color.splashBackground));

        ImageView mark = new ImageView(activity);
        mark.setImageDrawable(ContextCompat.getDrawable(activity, R.drawable.ic_brand_mark));
        box.addView(mark, new LinearLayout.LayoutParams(dp(128), dp(128)));

        box.addView(text(R.string.app_name, 20, Typeface.BOLD, R.color.ink), stacked(2));

        ProgressBar spinner = new ProgressBar(activity);
        spinner.setIndeterminate(true);
        spinner.setIndeterminateTintList(ColorStateList.valueOf(colour(R.color.colorPrimary)));
        box.addView(spinner, stacked(32, dp(26), dp(26)));

        return box;
    }

    private View buildOffline() {
        LinearLayout box = column();
        box.setBackgroundColor(colour(R.color.surface));
        box.setPadding(dp(32), dp(32), dp(32), dp(32));

        ImageView mark = new ImageView(activity);
        mark.setImageDrawable(ContextCompat.getDrawable(activity, R.drawable.ic_brand_mark));
        mark.setAlpha(0.35f);
        box.addView(mark, new LinearLayout.LayoutParams(dp(96), dp(96)));

        box.addView(text(R.string.offline_title, 20, Typeface.BOLD, R.color.ink), stacked(10));

        TextView message = text(R.string.offline_message, 14, Typeface.NORMAL, R.color.muted);
        message.setTag("message");
        message.setLineSpacing(dp(4), 1f);
        box.addView(message, stacked(8));

        TextView retry = text(R.string.offline_retry, 15, Typeface.BOLD, android.R.color.white);
        retry.setPadding(dp(34), dp(13), dp(34), dp(13));
        GradientDrawable pill = new GradientDrawable();
        pill.setColor(colour(R.color.colorPrimary));
        pill.setCornerRadius(dp(14));
        retry.setBackground(pill);
        retry.setOnClickListener(v -> onRetry.run());
        box.addView(retry, stacked(24));

        return box;
    }

    // ----------------------------------------------------------- small stuff

    private static final int MATCH = ViewGroup.LayoutParams.MATCH_PARENT;
    private static final int WRAP = ViewGroup.LayoutParams.WRAP_CONTENT;

    private LinearLayout column() {
        LinearLayout box = new LinearLayout(activity);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        // Swallows taps so nothing on the page underneath can be pressed blind.
        box.setClickable(true);
        return box;
    }

    private TextView text(int stringRes, float sizeSp, int style, int colourRes) {
        TextView view = new TextView(activity);
        view.setText(stringRes);
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp);
        view.setTypeface(null, style);
        view.setTextColor(colour(colourRes));
        view.setGravity(Gravity.CENTER);
        return view;
    }

    private LinearLayout.LayoutParams stacked(int topDp) {
        return stacked(topDp, WRAP, WRAP);
    }

    private LinearLayout.LayoutParams stacked(int topDp, int width, int height) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(width, height);
        lp.topMargin = dp(topDp);
        return lp;
    }

    private static FrameLayout.LayoutParams fill() {
        return new FrameLayout.LayoutParams(MATCH, MATCH);
    }

    private static void resize(View view, int heightPx) {
        ViewGroup.LayoutParams lp = view.getLayoutParams();
        if (lp.height == heightPx) return;
        lp.height = heightPx;
        view.setLayoutParams(lp);
    }

    private int colour(int res) {
        return ContextCompat.getColor(activity, res);
    }

    private int dp(int value) {
        return Math.round(value * activity.getResources().getDisplayMetrics().density);
    }
}
