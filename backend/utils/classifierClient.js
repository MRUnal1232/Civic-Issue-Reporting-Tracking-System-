const CLASSIFIER_URL = process.env.JAVA_CLASSIFIER_URL || 'http://localhost:8080';

/**
 * Calls the Java classifier microservice for an auto-suggested category/priority.
 * This is a non-blocking enhancement: any failure (service down, timeout, bad
 * response) is swallowed and null is returned so issue creation never depends
 * on the classifier being available.
 */
async function getSuggestion(title, description) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${CLASSIFIER_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

module.exports = { getSuggestion };
