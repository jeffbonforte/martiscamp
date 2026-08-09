import React from 'react';
import { setAttendanceDates } from './api.js';
import { useToast } from './toast.jsx';

// Shared write path for the single-day attendance toggles (the home "Mark your
// days" picker and the calendar grid). Both screens need the same thing — write
// one day, toast, undo the optimistic update if the write fails — so the copy
// and the rollback live here rather than being duplicated per screen.

const dayLabel = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/**
 * `onApply` optimistically folds a { add, remove } delta into the app dataset;
 * on failure the inverse delta is applied to undo it. Returns the api result so
 * the caller can roll back its own local selection too.
 */
export function useMarkAttendance({ scope = 'family', onApply } = {}) {
  const { push } = useToast();
  const applyRef = React.useRef(onApply);
  applyRef.current = onApply;

  const markDay = React.useCallback(async (iso, on, date) => {
    const delta = on ? { add: [iso] } : { remove: [iso] };
    applyRef.current?.(delta);
    const r = await setAttendanceDates(scope, delta);
    // Mock mode has nothing to persist, so `offline` counts as success and the
    // picker stays responsive (same convention as PlanVisit / AddMemberDialog).
    if (!r.ok && !r.offline) {
      applyRef.current?.(on ? { remove: [iso] } : { add: [iso] });
      push({
        icon: 'alert-triangle', tone: 'danger', title: "Couldn't save that day",
        message: r.error || 'Check your connection and try again.',
      });
      return r;
    }
    const label = dayLabel(date);
    push({
      icon: 'calendar-check', tone: 'success',
      title: on ? `Marked ${label}` : `Cleared ${label}`,
      message: on ? 'Other families can see your visit.' : 'Removed from your visit.',
    });
    return r;
  }, [scope, push]);

  return { markDay };
}
