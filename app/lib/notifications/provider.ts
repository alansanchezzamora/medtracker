import {
  getNotificationProviderName,
  getTwilioNotificationConfig,
} from "./config";
import { DevelopmentNotificationProvider } from "./development-provider";
import { TwilioNotificationProvider } from "./twilio-provider";
import type { NotificationProvider } from "./types";

export function createNotificationProvider(
  env: NodeJS.ProcessEnv = process.env,
): NotificationProvider {
  const providerName = getNotificationProviderName(env);

  if (providerName === "twilio") {
    return new TwilioNotificationProvider(
      getTwilioNotificationConfig(env),
    );
  }

  return new DevelopmentNotificationProvider();
}
