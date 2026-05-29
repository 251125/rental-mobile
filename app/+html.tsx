import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* maximum-scale=1 предотвращает авто-зум Safari при фокусе на input */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Запрет горизонтального скролла */
          html, body {
            overflow-x: hidden;
            max-width: 100vw;
            position: relative;
          }
          /* Все input/textarea минимум 16px — предотвращает зум Safari */
          input, textarea, select {
            font-size: 16px !important;
          }
          /* Убираем highlight при тапе на iOS */
          * {
            -webkit-tap-highlight-color: transparent;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
