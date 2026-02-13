const state = {
  noFaceStart: null,
  tabSwitchCount: 0,
  lastEmit: {}
};

export function processEvent(event, emit) {
  const now = Date.now();

  // ---------- NO FACE ----------
  if (event.type === "no_face") {
    if (!state.noFaceStart) {
      state.noFaceStart = now;
    }

    const duration = (now - state.noFaceStart) / 1000;

    if (duration >= 10) {
      emitOnce(
        {
          type: "no_face",
          severity: "medium",
          duration
        },
        emit
      );
    }
    return;
  }

  // ---------- FACE BACK ----------
  if (event.type === "face_detected") {
    state.noFaceStart = null;
    return;
  }

  // ---------- MULTI FACE ----------
  if (event.type === "multi_face") {
    emitOnce(
      {
        type: "multi_face",
        severity: "high",
        count: event.count
      },
      emit
    );
    return;
  }

  // ---------- LOOKING AWAY ----------
  if (event.type === "looking_away") {
    emitOnce(
      {
        type: "looking_away",
        severity: "medium"
      },
      emit
    );
    return;
  }

  // ---------- OBJECT DETECTED ----------
  if (event.type === "object_detected") {
    emitOnce(
      {
        type: "object_detected",
        severity: "high",
        object: event.object
      },
      emit
    );
    return;
  }

  // ---------- TAB SWITCH ----------
  if (event.type === "tab_switch") {
    state.tabSwitchCount++;

    if (state.tabSwitchCount >= 3) {
      emitOnce(
        {
          type: "tab_switch",
          severity: "high",
          count: state.tabSwitchCount
        },
        emit
      );
    }
  }
}

// 🔁 Prevent spam alerts
function emitOnce(event, emit) {
  const key = event.type;
  const now = Date.now();

  if (!state.lastEmit[key] || now - state.lastEmit[key] > 5000) {
    state.lastEmit[key] = now;
    emit(event);
  }
}
