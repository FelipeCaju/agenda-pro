declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              shape?: "pill" | "rectangular" | "circle" | "square";
              text?: string;
              width?: number;
              logo_alignment?: "left" | "center";
            },
          ) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (options: {
          clientId: string;
          scope?: string;
          redirectURI?: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization?: {
            id_token?: string;
          };
        }>;
      };
    };
  }
}

export {};
