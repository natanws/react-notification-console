const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** First block of a UUID: enough to tell rows apart in a table. */
export function shortId(id: string): string {
  return id.split('-')[0];
}
