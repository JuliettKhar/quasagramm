export const isOnline = async () => {
  if (!window.navigator.onLine) return false;

  // avoid CORS errors with a request to your own origin
  const url = new URL(window.location.origin);

  // random value to prevent cached responses
  url.searchParams.set('rand1', Math.random().toString(36).substring(2, 15));

  try {

    const response = await fetch(url.toString(), { method: 'HEAD' });
    console.log(response, 'response')
    return response.ok;
  } catch {
     console.log(false, 'response')
    return false;
  }
}
