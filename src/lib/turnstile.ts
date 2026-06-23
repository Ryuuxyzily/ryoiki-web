export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = "0x4AAAAAADpuwgzV8MqWvLfv8U-MyjAX3L8";
  
  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    });

    const outcome = await result.json();
    return outcome.success;
  } catch (error) {
    console.error("Turnstile verification failed:", error);
    return false;
  }
}
