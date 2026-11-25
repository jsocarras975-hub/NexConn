<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> — RSS Feed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body { background: #080b12; color: #e2e8f0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; margin: 0; line-height: 1.6; }
          main { max-width: 720px; margin: 0 auto; padding: 48px 20px; }
          .eyebrow { color: #22d3ee; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 8px; }
          h1 { font-size: 28px; margin: 0 0 8px; color: #f1f5f9; }
          .desc { color: #94a3b8; margin: 0 0 16px; }
          .note { background: rgba(34, 211, 238, 0.08); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 12px; padding: 14px 16px; font-size: 14px; color: #cbd5e1; }
          .note a { color: #22d3ee; }
          ul { list-style: none; margin: 32px 0 0; padding: 0; }
          li { border-top: 1px solid rgba(255, 255, 255, 0.08); padding: 20px 0; }
          li a { color: #22d3ee; font-size: 18px; font-weight: 600; text-decoration: none; }
          li a:hover { text-decoration: underline; }
          .date { display: block; font-size: 12px; color: #64748b; margin-top: 4px; }
          li p { color: #94a3b8; font-size: 14px; margin: 8px 0 0; }
        </style>
      </head>
      <body>
        <main>
          <p class="eyebrow">RSS Feed</p>
          <h1><xsl:value-of select="/rss/channel/title"/></h1>
          <p class="desc"><xsl:value-of select="/rss/channel/description"/></p>
          <p class="note">This is an RSS feed. Copy this page's address into your feed reader to subscribe, or <a href="/journal">read the journal on the site</a>.</p>
          <ul>
            <xsl:for-each select="/rss/channel/item">
              <li>
                <a href="{link}"><xsl:value-of select="title"/></a>
                <span class="date"><xsl:value-of select="pubDate"/></span>
                <p><xsl:value-of select="description"/></p>
              </li>
            </xsl:for-each>
          </ul>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
