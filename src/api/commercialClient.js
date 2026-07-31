const parseResponse = async (response) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error || `HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
};

const request = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return parseResponse(response);
};

export const commercialClient = {
  leads: {
    create(payload) {
      return request("/api/leads", { method: "POST", body: payload });
    },
    list() {
      return request("/api/leads");
    },
    update(id, payload) {
      return request(`/api/leads/${encodeURIComponent(id)}`, { method: "PATCH", body: payload });
    },
    delete(id) {
      return request(`/api/leads/${encodeURIComponent(id)}`, { method: "DELETE" });
    }
  },
  analytics: {
    track(event, details = {}) {
      const payload = JSON.stringify({ event, ...details });
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const sent = navigator.sendBeacon("/api/analytics/events", new Blob([payload], { type: "application/json" }));
        if (sent) return;
      }
      fetch("/api/analytics/events", {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: payload
      }).catch(() => null);
    },
    summary(days = 30) {
      return request(`/api/analytics/summary?days=${encodeURIComponent(days)}`);
    }
  }
};
