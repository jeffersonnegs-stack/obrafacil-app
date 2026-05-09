<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#0b1f33">
<title>ObraFácil — Sem conexão</title>
<style>
  body {
    font-family: 'DM Sans', sans-serif;
    background: #0b1f33;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    color: #fff;
  }
  .icone   { font-size: 64px; margin-bottom: 20px; }
  .titulo  { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
  .desc    { font-size: 14px; color: rgba(255,255,255,.6); line-height: 1.7; margin-bottom: 32px; }
  .btn     { padding: 14px 28px; background: #ff8c00; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; }
  .btn:hover { opacity: .88; }
</style>
</head>
<body>
  <div class="icone">📵</div>
  <div class="titulo">Sem conexão com a internet</div>
  <div class="desc">
    Verifique sua rede Wi-Fi ou dados móveis<br>e tente novamente.
  </div>
  <button class="btn" onclick="window.location.reload()">Tentar novamente</button>
</body>
</html>
