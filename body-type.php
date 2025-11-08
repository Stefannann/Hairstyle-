<?php
?><!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Body Type Kompass</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body class="bodytype-page">
    <header class="bodytype-header">
      <div class="header-inner">
        <h1>Body Type Kompass</h1>
        <p>
          Finde deine Silhouette, entdecke passende Schnitte und kombiniere das Ergebnis
          mit deinem persönlichen Frisurenprofil.
        </p>
        <nav class="bodytype-nav">
          <a href="#guide">Guide</a>
          <a href="#styling">Styling-Tipps</a>
          <a href="#impressum">Impressum</a>
        </nav>
      </div>
    </header>

    <main class="bodytype-content">
      <section id="guide" class="bodytype-card">
        <h2>Silhouetten-Guide</h2>
        <p>
          Identifiziere deine Körperform, indem du Schulter-, Taillen- und Hüftumfang vergleichst.
          Unser Kompass begleitet dich mit klaren Fragen und Visualisierungen.
        </p>
        <ul>
          <li><strong>A-Linie:</strong> Schmale Schultern, kräftigere Hüften – betone deine Taille.</li>
          <li><strong>V-Linie:</strong> Breite Schultern, schmalere Hüften – arbeite mit Volumen unten.</li>
          <li><strong>X-Linie:</strong> Ausgeglichene Schultern und Hüften mit schmaler Taille – feiere Kurven.</li>
          <li><strong>H-Linie:</strong> Gerade Silhouette – schaffe optische Taille mit Layering.</li>
          <li><strong>O-Linie:</strong> Mehr Volumen in der Körpermitte – setze auf fließende Stoffe und V-Ausschnitte.</li>
        </ul>
      </section>

      <section id="styling" class="bodytype-card">
        <h2>Styling-Tipps</h2>
        <p>
          Kombiniere Kleidungs- und Frisurentipps für einen ganzheitlichen Look. Unser Frisuren-Scout
          analysiert Stirnhöhe, Symmetrie, Augen- und Haarfarbe sowie dein Altersprofil, um passende Cuts
          vorzuschlagen.
        </p>
        <p>
          Ergänzend dazu liefert dieser Body-Type-Guide Empfehlungen zu Stoffen, Schnitten und Accessoires,
          damit deine Silhouette optimal zur Geltung kommt.
        </p>
      </section>

      <section id="impressum" class="bodytype-card">
        <h2>Impressum</h2>
        <p><strong>Frisuren-Scout Studio</strong></p>
        <p>Fiktive Straße 12, 10115 Berlin</p>
        <p>Telefon: <a href="tel:+49301234567">+49 30 123 45 67</a></p>
        <p>E-Mail: <a href="mailto:hallo@frisuren-scout.de">hallo@frisuren-scout.de</a></p>
        <p>
          Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:<br />
          Jamie Mustermann, Anschrift wie oben.
        </p>
        <p>
          Bei Fragen zum Datenschutz findest du alle Informationen in unserer
          <a href="#datenschutz" class="inline-link">Datenschutzerklärung</a>.
        </p>
      </section>

      <section id="datenschutz" class="bodytype-card">
        <h2>Datenschutzerklärung</h2>
        <p>
          Es werden keine personenbezogenen Daten auf dem Server gespeichert. Die Analyse deiner Silhouette
          sowie deiner Gesichtszüge erfolgt ausschließlich lokal in deinem Browser.
        </p>
        <p>
          Für Rückfragen kannst du uns jederzeit über die oben genannten Kontaktdaten erreichen.
        </p>
      </section>
    </main>

    <footer class="bodytype-footer">
      <a href="#impressum">Zurück zum Impressum</a>
      <span>© <?php echo date('Y'); ?> Frisuren-Scout Studio</span>
    </footer>
  </body>
</html>
