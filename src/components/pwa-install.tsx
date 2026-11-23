"use client";

import { useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "nexcon-pwa-dismissed";

/**
 * Registers the service worker, surfaces the install prompt as a small
 * dismissible banner, and offers a one-tap update when a new version of the
 * app is waiting. Renders nothing when the app is already installed
 * (standalone) or the browser offers no install path.
 */
export function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(isStandalone);
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          regRef.current = reg;
          if (reg.waiting) setUpdateReady(true);
          reg.addEventListener("updatefound", () => {
            const next = reg.installing;
            if (!next) return;
            next.addEventListener("statechange", () => {
              if (next.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateReady(true);
              }
            });
          });
        })
        .catch(() => {
          /* Service worker blocked or unsupported: the app still works. */
        });

      // A new worker took over: reload once so the user gets the new version.
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setShowBanner(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Show the banner a few seconds after load, once per session, only when
  // there is actually something to install (Android/Chrome prompt, or iOS
  // where the user adds it from the Share menu).
  useEffect(() => {
    if (standalone || showBanner) return;
    if (!deferred && !isIos) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    const timer = window.setTimeout(() => setShowBanner(true), 4000);
    return () => window.clearTimeout(timer);
  }, [deferred, isIos, standalone, showBanner]);

  if (standalone) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setShowBanner(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShowBanner(false);
  };

  const applyUpdate = () => {
    regRef.current?.waiting?.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]">
      {updateReady && (
        <div className="card flex w-full items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">A new version is ready</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Update now to get the latest NEXCON.
            </p>
          </div>
          <button type="button" className="btn-primary shrink-0" onClick={applyUpdate}>
            Update
          </button>
        </div>
      )}

      {showBanner && (
        <div className="card flex w-full items-center gap-3 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={40}
            height={40}
            className="shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Install the NEXCON app</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-400">
              {isIos && !deferred
                ? "Tap Share, then “Add to Home Screen” to install it."
                : "Add NEXCON to your home screen for the full-screen app experience."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            {deferred && (
              <button type="button" className="btn-primary" onClick={install}>
                Install
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={dismiss}>
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
