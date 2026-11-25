"use client";

// Sign-out form. Before the POST navigates away, it tells the service worker
// to drop the cached pages, so nothing from the signed-in session lingers on
// a shared device after logout. Fire and forget — the form POST proceeds
// regardless of whether a worker is controlling the page.
export function SignOutForm() {
  const handleSubmit = () => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_PAGE_CACHE" });
    }
  };

  return (
    <form action="/api/auth/logout" method="post" onSubmit={handleSubmit}>
      <button className="btn-secondary">Sign out</button>
    </form>
  );
}
