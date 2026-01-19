import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const useHaptics = () => {
  const lightTap = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available (web fallback)
    }
  };

  const mediumTap = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics not available (web fallback)
    }
  };

  const heavyTap = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Haptics not available (web fallback)
    }
  };

  const successNotification = async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Haptics not available (web fallback)
    }
  };

  const errorNotification = async () => {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      // Haptics not available (web fallback)
    }
  };

  const selectionChanged = async () => {
    try {
      await Haptics.selectionChanged();
    } catch {
      // Haptics not available (web fallback)
    }
  };

  return {
    lightTap,
    mediumTap,
    heavyTap,
    successNotification,
    errorNotification,
    selectionChanged,
  };
};
