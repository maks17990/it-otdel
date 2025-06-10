export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env && env !== '') return env;

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    return `${protocol}//${host}:3000`;
  }

  return 'http://localhost:3000';
}
