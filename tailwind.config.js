export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        ncf: {
          green: {
            50:  "#F3F6F4",
            100: "#E6ECE8",
            200: "#CDDAD1",
            300: "#B4C7BA",
            400: "#82A28C",
            500: "#064519", // Primary
            600: "#053B16",
            700: "#043212",
            800: "#03280E",
            900: "#031E0B",
          },
          moss: "#3C5A29",
          gold: {
            50:  "#FFFCF4",
            100: "#FFFAE9",
            200: "#FFF4D3",
            300: "#FEEEBD",
            400: "#FEE491",
            500: "#FDC823", // Accent
            600: "#DAAC1E",
            700: "#B69019",
            800: "#937414",
            900: "#6F580F",
          },
          paper: "#F1F2F1",
          cream: "#F6F5E3",
          ink:   "#0F1412",
          white: "#FFFFFF",
          torch: "#E8831A",
        },
      },
      boxShadow: {
        glass: "0 10px 30px rgba(6, 69, 25, 0.25)",
      },
      backdropBlur: {
        xl: "16px",
      },
    },
  },
  plugins: [],
};
