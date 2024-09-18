import { isolateInsideOfContainer, scopedPreflightStyles } from 'tailwindcss-scoped-preflight';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", 
    "./lib/**/*.{html,js,ts,jsx,tsx}", 
    "./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        'body-lg': '1vmin',
        'body': '1vmin',
      }
    }
  },
  prefix: "tw-",
  plugins: [
    scopedPreflightStyles({
      isolationStrategy: isolateInsideOfContainer('.tailwind')})
  ],
}

