export function getNowDatetimeLocal() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const mins = pad(now.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mins}`;
  }
  
export function getTodayThresholdDatetimeLocal() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    // Start of today at 00:00
    return `${yyyy}-${mm}-${dd}T00:00`;
}
  
export function formatDueDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    let datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    let hours = d.getHours();
    let mins = d.getMinutes();
    if (!isNaN(hours) && !isNaN(mins)) {
        return `${datePart}, ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    } else {
        return datePart;
    }
}
  
export function formatBirthday(birthday) {
    if (!birthday) return null;
    const d = new Date(birthday);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
  
export function isDateToday(dueDateStr) {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    return (
        due instanceof Date &&
        now instanceof Date &&
        due.getFullYear() === now.getFullYear() &&
        due.getMonth() === now.getMonth() &&
        due.getDate() === now.getDate()
    );
}
  
export function isDateUpcoming(dueDateStr) {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    return due > now && !isDateToday(dueDateStr);
}
  
export function isDateOverdue(dueDateStr) {
    if (!dueDateStr) return false;
    const due = new Date(dueDateStr);
    const now = new Date();
    return due < now && !isDateToday(dueDateStr);
}
  
export function getDueStatus(dueDateStr) {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const now = new Date();
    if (isNaN(due.getTime())) return null;
    if (due < now && !isDateToday(dueDateStr)) return "overdue";
    if (isDateToday(dueDateStr)) return "today";
    if (due > now) return "upcoming";
    return null;
}