# R8 rules for the WeddingMall.Online wrapper.
#
# The app is small, but almost all of its surface is reached from outside Java —
# from JavaScript in the WebView, or reflectively by Capacitor — so the usual
# "unused code" analysis cannot see the callers.

# Anything the page calls over addJavascriptInterface. R8 has no way to know
# Downloads$JsBridge.save() is invoked, and stripping or renaming it would break
# every biodata PDF download in the release build while leaving debug fine.
-keepclasseswithmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capacitor resolves plugins, their methods and their config by name.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.PluginMethod public <methods>;
}
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep class org.apache.cordova.** { *; }

# WebView callbacks and the JSON types Capacitor passes across the bridge.
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String);
    public boolean *(android.webkit.WebView, android.webkit.WebResourceRequest);
}
-keep class org.json.** { *; }

# Crash reports from the Play Console are unreadable without these; they name
# classes and lines, not their contents, so nothing sensitive is exposed.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
