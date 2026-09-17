(() => {
  const sources = {
    toc: {
      label: "Wichmann/Langer – Inhaltsübersicht (8. Aufl. 2017)",
      url: "https://api.pageplace.de/preview/DT0400.9783555019116_A29666092/preview-9783555019116_A29666092.pdf"
    },
    kohlhammer: {
      label: "Kohlhammer – Öffentliches Dienstrecht (8. Aufl. 2017)",
      url: "https://shop.kohlhammer.de/offentliches-dienstrecht-1910.html"
    },
    gg33: {
      label: "Art. 33 GG",
      url: "https://www.gesetze-im-internet.de/gg/art_33.html"
    },
    beamtstg: {
      label: "Beamtenstatusgesetz (BeamtStG)",
      url: "https://www.gesetze-im-internet.de/beamtstg/"
    },
    bbg: {
      label: "Bundesbeamtengesetz (BBG)",
      url: "https://www.gesetze-im-internet.de/bbg_2009/"
    },
    blv: {
      label: "Bundeslaufbahnverordnung (BLV)",
      url: "https://www.gesetze-im-internet.de/blv_2009/"
    },
    bbesg: {
      label: "Bundesbesoldungsgesetz (BBesG)",
      url: "https://www.gesetze-im-internet.de/bbesg/"
    },
    beamtvg: {
      label: "Beamtenversorgungsgesetz (BeamtVG)",
      url: "https://www.gesetze-im-internet.de/beamtvg/"
    },
    bdg: {
      label: "Bundesdisziplinargesetz (BDG)",
      url: "https://www.gesetze-im-internet.de/bdg/"
    },
    bgb611a: {
      label: "§ 611a BGB – Arbeitsvertrag",
      url: "https://www.gesetze-im-internet.de/bgb/__611a.html"
    },
    agg: {
      label: "Allgemeines Gleichbehandlungsgesetz (AGG)",
      url: "https://www.gesetze-im-internet.de/agg/"
    },
    tvg: {
      label: "Tarifvertragsgesetz (TVG)",
      url: "https://www.gesetze-im-internet.de/tvg/"
    },
    tzbfg: {
      label: "Teilzeit- und Befristungsgesetz (TzBfG)",
      url: "https://www.gesetze-im-internet.de/tzbfg/"
    },
    arbgg: {
      label: "Arbeitsgerichtsgesetz (ArbGG)",
      url: "https://www.gesetze-im-internet.de/arbgg/"
    },
    bpersvg: {
      label: "Bundespersonalvertretungsgesetz (BPersVG)",
      url: "https://www.gesetze-im-internet.de/bpersvg_2021/"
    },
    betrvg: {
      label: "Betriebsverfassungsgesetz (BetrVG)",
      url: "https://www.gesetze-im-internet.de/betrvg/"
    }
  };

  const q = (prompt, options, correct, explanation, sourceKeys, difficulty) => ({
    prompt, options, correct, explanation, sources: sourceKeys, difficulty
  });

  const stages = [
    {
      id: "i-01-einfuehrung",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Einführung",
      summary: "Verfassungsrahmen, öffentlicher Dienst und die Trennung von Beamten- und Arbeitsverhältnis.",
      questions: [
        q("Welche drei Kriterien nennt Art. 33 Abs. 2 GG für den gleichen Zugang zu öffentlichen Ämtern?", ["Alter, Dienstzeit, Familienstand", "Eignung, Befähigung, fachliche Leistung", "Wohnort, Abschlussnote, Parteibuch", "Loyalität, Einkommen, Berufserfahrung"], 1, "Art. 33 Abs. 2 GG formuliert die sogenannte Bestenauslese: Eignung, Befähigung und fachliche Leistung sind die maßgeblichen Auswahlkriterien.", ["gg33"], 1),
        q("Was unterscheidet Beamte typischerweise von Tarifbeschäftigten des öffentlichen Dienstes?", ["Beamte arbeiten nie in Kommunen", "Tarifbeschäftigte haben keine Grundrechte", "Beamte stehen in einem öffentlich-rechtlichen Dienst- und Treueverhältnis; Tarifbeschäftigte in einem privatrechtlichen Arbeitsverhältnis", "Nur Tarifbeschäftigte dürfen hoheitliche Aufgaben wahrnehmen"], 2, "Beamtenverhältnisse sind öffentlich-rechtlich ausgestaltet. Das Arbeitsverhältnis der Tarifbeschäftigten beruht dagegen auf Arbeitsvertrag und Arbeitsrecht.", ["gg33", "beamtstg", "bgb611a"], 2),
        q("Was sagt Art. 33 Abs. 4 GG zum Funktionsvorbehalt?", ["Jede staatliche Tätigkeit muss zwingend durch Beamte erledigt werden", "Hoheitsrechtliche Befugnisse sind als ständige Aufgabe in der Regel Personen in einem öffentlich-rechtlichen Dienst- und Treueverhältnis zu übertragen", "Hoheitsrechtliche Aufgaben dürfen nur Richter wahrnehmen", "Der Funktionsvorbehalt betrifft ausschließlich Soldaten"], 1, "Der Funktionsvorbehalt ist eine Regel, keine ausnahmslose Monopolisierung sämtlicher staatlicher Tätigkeiten durch Beamte.", ["gg33"], 3),
        q("Warum behandelt ein Gesamtüberblick zum öffentlichen Dienst sowohl Beamten- als auch Arbeitsrecht?", ["Weil alle Beschäftigten zugleich Beamte und Arbeitnehmer sind", "Weil der öffentliche Dienst aus statusrechtlich unterschiedlichen Beschäftigtengruppen besteht", "Weil Arbeitsrecht nur für Bundesbeamte gilt", "Weil Beamtenrecht durch Tarifvertrag entsteht"], 1, "Auch Wichmann/Langer gliedern das Handbuch in Beamtenrecht samt Nebengebieten und einen eigenen arbeitsrechtlichen Teil. Die Statusgruppen folgen unterschiedlichen Rechtsregimen.", ["toc", "kohlhammer"], 4)
      ]
    },
    {
      id: "i-02-rechtsquellen-beamtenrecht",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Rechtsquellen des Beamtenrechts",
      summary: "Grundgesetz, Statusrecht des Bundes und der Länder sowie ergänzendes Bundes- und Landesrecht.",
      questions: [
        q("Wo steht der zentrale Verfassungsauftrag, das Recht des öffentlichen Dienstes unter Berücksichtigung der hergebrachten Grundsätze des Berufsbeamtentums zu regeln und fortzuentwickeln?", ["Art. 1 Abs. 1 GG", "Art. 20 Abs. 3 GG", "Art. 33 Abs. 5 GG", "Art. 80 Abs. 1 GG"], 2, "Art. 33 Abs. 5 GG ist die zentrale Verfassungsnorm für die hergebrachten Grundsätze des Berufsbeamtentums.", ["gg33"], 1),
        q("Welches Gesetz regelt zentrale statusrechtliche Fragen für Beamtinnen und Beamte der Länder, Gemeinden und Gemeindeverbände?", ["BBG", "BeamtStG", "TVG", "BetrVG"], 1, "Das BeamtStG enthält das länderübergreifende Statusrecht. Für Bundesbeamtinnen und -beamte ist insbesondere das BBG maßgeblich.", ["beamtstg", "bbg"], 2),
        q("Welche Aussage zur Rechtsquellenlage ist richtig?", ["Das BBG ersetzt alle Landesbeamtengesetze", "Das BeamtStG regelt nur Tarifbeschäftigte", "Bundes- und Landesdienstrecht haben unterschiedliche Regelungsebenen; Landesrecht ergänzt das Statusrecht in seinem Kompetenzbereich", "Beamtenrecht entsteht überwiegend durch Betriebsvereinbarungen"], 2, "Für Landes- und Kommunalbeamte wirkt das BeamtStG als Statusrahmen neben Landesrecht. Bundesbeamte unterliegen dem Bundesbeamtenrecht.", ["beamtstg", "bbg"], 3),
        q("Was folgt aus dem Gesetzesvorbehalt im Besoldungs- und Statusrecht am ehesten?", ["Individuelle Verträge können den Beamtenstatus frei umgestalten", "Statusprägende Rechte und Pflichten müssen auf gesetzlicher Grundlage beruhen", "Tarifverträge haben Vorrang vor dem Grundgesetz", "Dienststellen dürfen jede Lücke per E-Mail schließen"], 1, "Das Beamtenverhältnis ist kein frei ausgehandeltes Vertragsverhältnis. Statusprägende Regelungen sind gesetzlich gebunden und verfassungsrechtlich überformt.", ["gg33", "beamtstg", "bbg"], 4)
      ]
    },
    {
      id: "i-03-grundbegriffe",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Grundbegriffe des Beamtenrechts",
      summary: "Amt, Planstelle, Dienstherr, Vorgesetztenbegriffe und Statusbezug.",
      questions: [
        q("Welche Größe gehört primär zum Haushaltsrecht und ist nicht mit dem statusrechtlichen Amt identisch?", ["Planstelle", "Amtsbezeichnung", "Dienstherr", "Ernennungsurkunde"], 0, "Die Planstelle ist eine haushaltsrechtliche Größe. Das statusrechtliche Amt beschreibt dagegen die beamtenrechtliche Rechtsstellung.", ["bbg"], 1),
        q("Was ist das funktionelle Amt im Kern?", ["Nur die Besoldungsgruppe", "Der konkrete bzw. abstrakt-funktionelle Aufgabenbereich, in dem der Beamte eingesetzt wird", "Der Haushaltstitel", "Die Staatsangehörigkeit"], 1, "Das funktionelle Amt betrifft die wahrgenommene Funktion bzw. den Aufgabenbereich; es ist vom statusrechtlichen Amt zu unterscheiden.", ["bbg"], 2),
        q("Wer kann nach § 2 BeamtStG Dienstherrnfähigkeit besitzen?", ["Nur der Bund", "Nur private Unternehmen", "Bund, Länder, Gemeinden und Gemeindeverbände sowie sonstige Körperschaften, Anstalten und Stiftungen des öffentlichen Rechts, soweit das Recht dies vorsieht", "Jede natürliche Person"], 2, "Dienstherrnfähigkeit ist öffentlich-rechtlich gebunden und ergibt sich aus Gesetz bzw. gesetzlicher Ermächtigung.", ["beamtstg"], 3),
        q("Warum ist die Unterscheidung zwischen Vorgesetztem und Dienstvorgesetztem praktisch wichtig?", ["Weil beide Begriffe immer dieselbe Person bezeichnen", "Weil Weisungsbefugnis im Arbeitsablauf und personalrechtliche Zuständigkeiten auseinanderfallen können", "Weil Dienstvorgesetzte keine Personalentscheidungen treffen dürfen", "Weil Vorgesetzte ausschließlich Gerichte sind"], 1, "Die Begriffe markieren unterschiedliche Zuständigkeitsrollen. Wer fachlich Weisungen geben darf, ist nicht automatisch für jede status- oder personalrechtliche Entscheidung zuständig.", ["bbg"], 4)
      ]
    },
    {
      id: "i-04-beamtenverhaeltnis",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Das Beamtenverhältnis",
      summary: "Arten, Zweck und Grundstruktur des öffentlich-rechtlichen Dienst- und Treueverhältnisses.",
      questions: [
        q("Welche Art des Beamtenverhältnisses bildet nach § 4 BeamtStG die Regel für die dauernde Wahrnehmung hoheitsrechtlicher Aufgaben?", ["Auf Widerruf", "Auf Probe", "Auf Lebenszeit", "Als Ehrenbeamter"], 2, "Das Beamtenverhältnis auf Lebenszeit ist für die dauernde Aufgabenwahrnehmung der Regelfall.", ["beamtstg"], 1),
        q("Wozu dient das Beamtenverhältnis auf Widerruf typischerweise?", ["Nur dem Ruhestand", "Dem Vorbereitungsdienst oder einer nur vorübergehenden Aufgabenwahrnehmung", "Ausschließlich kommunalen Wahlämtern", "Der unbefristeten Leitungsfunktion"], 1, "§ 4 Abs. 4 BeamtStG nennt insbesondere den Vorbereitungsdienst und die nur vorübergehende Wahrnehmung entsprechender Aufgaben.", ["beamtstg"], 2),
        q("Welcher Zweck ist typisch für das Beamtenverhältnis auf Probe?", ["Erprobung vor späterer Verwendung auf Lebenszeit oder für ein leitendes Amt", "Dauerhafte Versorgung ohne Dienstleistung", "Vertretung eines Tarifbeschäftigten", "Umgehung jeder laufbahnrechtlichen Voraussetzung"], 0, "Das Probebeamtenverhältnis dient der Bewährung/Erprobung vor der Lebenszeitverbeamtung oder in gesetzlich geregelten Leitungsfällen.", ["beamtstg"], 3),
        q("Welche Aussage beschreibt das Beamtenverhältnis rechtlich am besten?", ["Ein frei kündbarer privatrechtlicher Dienstvertrag", "Ein öffentlich-rechtliches Dienst- und Treueverhältnis mit gesetzlich geprägtem Status", "Ein Tarifvertrag zwischen Person und Staat", "Eine ehrenamtliche Tätigkeit ohne Pflichten"], 1, "Der Beamtenstatus wird durch Gesetz und Ernennung geprägt; er ist gerade kein frei ausgehandelter Arbeitsvertrag.", ["gg33", "beamtstg"], 4)
      ]
    },
    {
      id: "i-05-ernennung",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Die Ernennung",
      summary: "Ernennungsfälle, Urkunde, Auswahlkriterien und Fehlerfolgen.",
      questions: [
        q("Wie erfolgt eine Ernennung nach § 8 BeamtStG grundsätzlich?", ["Durch mündlichen Handschlag", "Durch Aushändigung einer Ernennungsurkunde mit vorgeschriebenem Inhalt", "Durch Eintrag in die Zeiterfassung", "Durch Tarifvertrag"], 1, "Die Urkundenform ist konstitutiv: § 8 BeamtStG schreibt die Aushändigung einer Ernennungsurkunde und bestimmte Formulierungen vor.", ["beamtstg"], 1),
        q("Welcher Vorgang ist ein Ernennungsfall nach § 8 BeamtStG?", ["Jede Änderung des Dienstzimmers", "Die Begründung eines Beamtenverhältnisses", "Jede Urlaubsbewilligung", "Die bloße Änderung einer Telefonnummer"], 1, "Begründung und Umwandlung des Beamtenverhältnisses sowie bestimmte Amtsverleihungen sind Ernennungsfälle.", ["beamtstg"], 2),
        q("Woran muss sich die Auswahl für eine Ernennung nach § 9 BeamtStG im Kern orientieren?", ["Parteizugehörigkeit", "Eignung, Befähigung und fachliche Leistung", "Familienstand", "Wohnortnähe"], 1, "Die Auswahl knüpft an die Leistungsgrundsätze an und darf nicht von sachfremden Kriterien getragen sein.", ["beamtstg", "gg33"], 3),
        q("Eine Behörde sagt einer Bewerberin mündlich: ‚Ab morgen bist du Beamtin auf Probe‘. Eine Urkunde wird nicht ausgehändigt. Was ist der entscheidende Punkt?", ["Die Ernennung ist allein wegen der Zusage wirksam", "Die gesetzliche Urkundenform für die Ernennung fehlt", "Mündliche Ernennungen sind nur am Freitag möglich", "Die Form ist nur eine Beweisfrage ohne Rechtswirkung"], 1, "Die formgerechte Aushändigung der Ernennungsurkunde ist gesetzlich vorgesehen. Eine bloße mündliche Zusage ersetzt sie nicht.", ["beamtstg"], 4)
      ]
    },
    {
      id: "i-06-laufbahnrecht",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Laufbahnrecht",
      summary: "Laufbahnen, Befähigung, Vorbereitungsdienst, Probezeit und Fortentwicklung.",
      questions: [
        q("Welche Verordnung ist eine zentrale laufbahnrechtliche Quelle für Bundesbeamtinnen und -beamte?", ["BLV", "StVO", "BetrVG", "TVG"], 0, "Die Bundeslaufbahnverordnung konkretisiert das Laufbahnrecht des Bundes.", ["blv", "bbg"], 1),
        q("Was beschreibt die Laufbahnbefähigung am ehesten?", ["Die gesundheitliche Tagesform", "Die rechtlich anerkannte Qualifikation für eine bestimmte Laufbahn", "Nur die aktuelle Besoldungsstufe", "Die Mitgliedschaft in einer Gewerkschaft"], 1, "Laufbahnbefähigung bezeichnet die für eine Laufbahn erforderliche und anerkannte Qualifikation, die auf unterschiedlichen geregelten Wegen erworben werden kann.", ["blv"], 2),
        q("Sind Vorbereitungsdienst und Probezeit dasselbe?", ["Ja, immer", "Nein; Vorbereitungsdienst dient typischerweise dem Erwerb der Laufbahnbefähigung, Probezeit der Bewährung für die spätere statusrechtliche Verwendung", "Nur bei Tarifbeschäftigten", "Nur im Ruhestand"], 1, "Die beiden Phasen haben unterschiedliche Funktionen. Der Vorbereitungsdienst ist häufig Ausbildung/Qualifikation; die Probezeit prüft die Bewährung.", ["blv", "beamtstg"], 3),
        q("Warum kann Laufbahnrecht zwischen Bund und Ländern unterschiedlich ausgestaltet sein?", ["Weil es keinerlei Verfassungsrecht gibt", "Weil neben dem bundesrechtlichen Statusrahmen eigene laufbahnrechtliche Regelungen des jeweiligen Dienstherrnbereichs bestehen", "Weil Länder das Grundgesetz abwählen können", "Weil Laufbahnrecht ausschließlich Tarifrecht ist"], 1, "Der bundesrechtliche Statusrahmen vereinheitlicht nicht jedes Detail der Laufbahnen. Bund und Länder haben eigene laufbahnrechtliche Regelungen in ihrem Kompetenzbereich.", ["beamtstg", "blv"], 4)
      ]
    },
    {
      id: "i-07-funktionelles-amt-umbildung",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Änderungen des funktionellen Amts und Behördenumbildung",
      summary: "Umsetzung, Abordnung, Versetzung und statuswahrende Organisationsänderungen.",
      questions: [
        q("Was kennzeichnet eine Abordnung typischerweise?", ["Eine vorübergehende Zuweisung einer Tätigkeit bei einer anderen Dienststelle", "Den endgültigen Verlust des Beamtenstatus", "Eine Disziplinarmaßnahme", "Die Pensionierung"], 0, "Die Abordnung ist auf vorübergehenden Einsatz gerichtet und unterscheidet sich damit von der auf Dauer angelegten Versetzung.", ["bbg"], 1),
        q("Was kennzeichnet eine Versetzung typischerweise?", ["Nur die Änderung des Schreibtischs", "Eine auf Dauer angelegte Übertragung eines Amtes/einer Tätigkeit bei einer anderen Dienststelle nach den gesetzlichen Voraussetzungen", "Immer eine Bestrafung", "Eine tarifliche Höhergruppierung"], 1, "Die Versetzung ist grundsätzlich auf dauerhaften Wechsel gerichtet; die gesetzlichen Voraussetzungen und Statusgrenzen sind zu beachten.", ["bbg"], 2),
        q("Welche Aussage zur Umsetzung ist am treffendsten?", ["Sie beendet stets das Beamtenverhältnis", "Sie betrifft regelmäßig die Änderung des konkreten Aufgabenbereichs innerhalb der Organisationsgewalt, ohne notwendig das statusrechtliche Amt zu ändern", "Sie ist identisch mit einer Ernennung", "Sie darf nur ein Gericht anordnen"], 1, "Die Umsetzung ist eine organisationsinterne Maßnahme am funktionellen Amt und ist von statusändernden Ernennungen zu unterscheiden.", ["bbg"], 3),
        q("Warum widmet das Beamtenrecht Behörden- und Körperschaftsumbildungen eigene Regeln?", ["Weil Organisationsänderungen statusrechtliche Zuordnung, Verwendung und Dienstherrnbeziehungen berühren können", "Weil Beamte bei jeder Fusion automatisch Arbeitnehmer werden", "Weil jede Umbildung das Grundgesetz außer Kraft setzt", "Weil nur die Büroausstattung betroffen ist"], 0, "Umbildungen können Dienstherrn- und Verwendungsfragen auslösen. Das BBG enthält hierfür besondere Regelungen, statt Statusfolgen dem Zufall zu überlassen.", ["bbg"], 4)
      ]
    },
    {
      id: "i-08-rechtsstellung",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Rechtsstellung des Beamten",
      summary: "Grundpflichten, politische Mäßigung, Gehorsam/Remonstration, Verschwiegenheit und Fürsorge.",
      questions: [
        q("Wem dienen Bundesbeamtinnen und -beamte nach § 60 BBG?", ["Nur ihrer Partei", "Dem ganzen Volk", "Nur der Dienststellenleitung", "Nur dem Haushaltsgesetzgeber"], 1, "§ 60 BBG verlangt unparteiische und gerechte Amtsführung zum Wohl der Allgemeinheit.", ["bbg"], 1),
        q("Was verlangt das beamtenrechtliche Mäßigungsgebot bei politischer Betätigung?", ["Vollständige politische Sprachlosigkeit", "Die der Stellung und den Amtspflichten entsprechende Mäßigung und Zurückhaltung", "Zwingend die Mitgliedschaft in einer Partei", "Nur Wahlenthaltung"], 1, "Politische Betätigung ist nicht generell verboten. Sie steht aber unter einer besonderen Mäßigungs- und Zurückhaltungspflicht.", ["bbg"], 2),
        q("Was soll ein Beamter tun, wenn er Bedenken gegen die Rechtmäßigkeit einer dienstlichen Anordnung hat?", ["Die Bedenken grundsätzlich auf dem vorgesehenen Remonstrationsweg geltend machen", "Die Anordnung heimlich löschen", "Sofort kündigen", "Immer kommentarlos ausführen, auch bei erkennbarer Strafbarkeit"], 0, "Das Beamtenrecht sieht ein abgestuftes Remonstrationsverfahren vor. Rechtmäßigkeitsbedenken werden zunächst gegenüber dem unmittelbaren Vorgesetzten und gegebenenfalls weiter vorgebracht.", ["bbg"], 3),
        q("Welche Aussage zur beamtenrechtlichen Verschwiegenheit ist richtig?", ["Dienstlich bekannt Gewordenes darf stets privat veröffentlicht werden", "Für dienstliche Angelegenheiten besteht grundsätzlich Verschwiegenheitspflicht; gesetzliche Ausnahmen und Freigaben sind zu beachten", "Verschwiegenheit gilt nur in der Probezeit", "Sie endet automatisch jeden Feierabend"], 1, "Die Verschwiegenheitspflicht schützt dienstliche Informationen und besteht nicht nur während der täglichen Dienstzeit. Ausnahmen bestimmen Gesetz und zuständige Stellen.", ["bbg"], 4)
      ]
    },
    {
      id: "i-09-pflichtverletzungen",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Folgen von Pflichtverletzungen",
      summary: "Dienstvergehen, Disziplinarfolgen, Schadensersatz und Verhältnis zu anderen Verfahren.",
      questions: [
        q("Was ist ein Dienstvergehen im Kern?", ["Jeder Tippfehler", "Eine schuldhafte Verletzung beamtenrechtlicher Pflichten", "Nur eine strafgerichtliche Verurteilung", "Nur ein finanzieller Schaden"], 1, "Disziplinarrecht knüpft an die schuldhafte Verletzung beamtenrechtlicher Pflichten an; Strafbarkeit ist dafür nicht zwingend erforderlich.", ["bbg", "bdg"], 1),
        q("Kann eine Pflichtverletzung disziplinarrechtlich relevant sein, obwohl sie nicht strafbar ist?", ["Nein, nie", "Ja; Disziplinar- und Strafrecht haben unterschiedliche Tatbestände und Zwecke", "Nur mit Zustimmung der Gewerkschaft", "Nur nach Pensionierung"], 1, "Ein Dienstvergehen setzt nicht zwingend eine Straftat voraus. Umgekehrt koordinieren Regeln das Verhältnis paralleler Straf- und Disziplinarverfahren.", ["bdg", "bbg"], 2),
        q("Welche Reaktion gehört zum disziplinarrechtlichen Instrumentarium des Bundes?", ["Verweis", "Führerscheinentzug durch die Dienststelle", "Zivilrechtliche Scheidung", "Wahlrechtsentzug durch Verwaltungsakt"], 0, "Das BDG kennt unter anderem Verweis, Geldbuße, Kürzung der Dienstbezüge, Zurückstufung und Entfernung aus dem Beamtenverhältnis.", ["bdg"], 3),
        q("Wann kann ein Bundesbeamter dem Dienstherrn wegen Pflichtverletzung zum Schadensersatz verpflichtet sein?", ["Bei jedem unvermeidbaren Missgeschick", "Insbesondere bei vorsätzlicher oder grob fahrlässiger Pflichtverletzung, die einen Schaden verursacht", "Nur bei einem Verkehrsdelikt", "Nie, weil immer der Staat haftet"], 1, "Die Innenhaftung gegenüber dem Dienstherrn ist gesetzlich insbesondere an Vorsatz oder grobe Fahrlässigkeit geknüpft.", ["bbg"], 4)
      ]
    },
    {
      id: "i-10-beendigung",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Beendigung des Beamtenverhältnisses",
      summary: "Entlassung, Verlust, disziplinare Entfernung und Ruhestand in ihren gesetzlichen Formen.",
      questions: [
        q("Welche Beendigung ist eine disziplinarrechtliche Maßnahme?", ["Versetzung", "Abordnung", "Entfernung aus dem Beamtenverhältnis", "Umsetzung"], 2, "Die Entfernung aus dem Beamtenverhältnis ist die schwerste statusbeendende Disziplinarmaßnahme für aktive Beamte.", ["bdg"], 1),
        q("Welche Besonderheit gilt typischerweise beim Beamtenverhältnis auf Widerruf?", ["Es kann nach den gesetzlichen Regeln jederzeit durch Entlassung beendet werden; im Vorbereitungsdienst soll Gelegenheit zur Beendigung des Vorbereitungsdienstes gegeben werden", "Es ist unkündbar bis zum 67. Lebensjahr", "Es endet nur durch Strafurteil", "Es wird automatisch ein Arbeitsvertrag"], 0, "Das BeamtStG erlaubt die Entlassung von Beamten auf Widerruf jederzeit, schützt aber den Ausbildungszweck des Vorbereitungsdienstes durch eine Sollregel.", ["beamtstg"], 2),
        q("Was ist beim Ausscheiden aus dem Beamtenstatus zentral?", ["Die Behörde kann frei jede Form erfinden", "Beendigungsgründe und Verfahren sind gesetzlich festgelegt", "Eine WhatsApp-Nachricht genügt immer", "Tarifrecht entscheidet allein"], 1, "Der Beamtenstatus ist gesetzlich gebunden. Entlassung, Verlust der Beamtenrechte, Disziplinarmaßnahmen und Ruhestandskonstellationen folgen gesetzlichen Voraussetzungen.", ["beamtstg", "bbg", "bdg"], 3),
        q("Warum ist ‚Ruhestand‘ nicht einfach mit einer arbeitsrechtlichen Kündigung gleichzusetzen?", ["Weil der Ruhestand eine beamtenrechtlich geregelte Status- und Versorgungsfolge ist", "Weil Ruhestand nur Tarifbeschäftigte betrifft", "Weil Pensionen privat ausgehandelt werden", "Weil im Ruhestand keinerlei beamtenrechtliche Pflichten fortwirken können"], 0, "Der Ruhestand ist Teil des beamtenrechtlichen Status- und Versorgungssystems und folgt eigenständigen gesetzlichen Regeln.", ["bbg", "beamtvg"], 4)
      ]
    },
    {
      id: "i-11-rechtsschutz",
      part: "Teil I · Allgemeines Beamtenrecht",
      title: "Beschwerdeweg und Rechtsschutz",
      summary: "Dienstweg, Widerspruch, Verwaltungsrechtsweg und besondere Rechtsschutzregeln.",
      questions: [
        q("Welcher Rechtsweg ist nach § 126 BBG für Klagen aus dem Bundesbeamtenverhältnis grundsätzlich eröffnet?", ["Finanzrechtsweg", "Verwaltungsrechtsweg", "Sozialrechtsweg", "Arbeitsrechtsweg"], 1, "Beamtenrechtliche Streitigkeiten des Bundes gehören grundsätzlich vor die Verwaltungsgerichte.", ["bbg"], 1),
        q("Was gilt nach § 125 BBG grundsätzlich für Anträge und Beschwerden?", ["Der Dienstweg ist einzuhalten", "Sie sind immer anonym", "Sie müssen direkt an den Bundestag", "Sie sind verboten"], 0, "Bundesbeamte dürfen Anträge und Beschwerden vorbringen; grundsätzlich ist dabei der Dienstweg einzuhalten.", ["bbg"], 2),
        q("Welche aktuelle Ausnahme nennt § 125 BBG ausdrücklich vom Dienstweg?", ["Jede Urlaubsfrage", "Meldungen oder Offenlegungen nach dem Hinweisgeberschutzgesetz", "Jede Reisekostenabrechnung", "Bewerbungen bei privaten Firmen"], 1, "Für Meldungen oder Offenlegungen nach dem Hinweisgeberschutzgesetz befreit § 125 Abs. 3 BBG ausdrücklich von der Einhaltung des Dienstwegs.", ["bbg"], 3),
        q("Welche Besonderheit nennt § 126 BBG für Widerspruch und Anfechtungsklage gegen Abordnung oder Versetzung?", ["Sie haben stets doppelte aufschiebende Wirkung", "Sie haben keine aufschiebende Wirkung", "Sie sind unzulässig", "Sie gehen zum Arbeitsgericht"], 1, "§ 126 Abs. 4 BBG ordnet für Abordnung und Versetzung an, dass Widerspruch und Anfechtungsklage keine aufschiebende Wirkung haben.", ["bbg"], 4)
      ]
    },
    {
      id: "ii-01-besoldung",
      part: "Teil II · Besoldungs-, Versorgungs- und Disziplinarrecht",
      title: "Grundzüge des Besoldungsrechts",
      summary: "Gesetzliche Besoldung, Alimentationsprinzip und Struktur der Dienstbezüge.",
      questions: [
        q("Wie wird Beamtenbesoldung grundsätzlich festgelegt?", ["Durch freien Einzelvertrag", "Durch Gesetz", "Durch Betriebsvereinbarung", "Durch Trinkgeldordnung"], 1, "Besoldung ist statusrechtlich gesetzlich geregelt und nicht Gegenstand freier individueller Lohnverhandlung wie im Arbeitsvertrag.", ["bbesg", "gg33"], 1),
        q("Was meint das Alimentationsprinzip?", ["Der Beamte finanziert seinen Dienstherrn", "Der Dienstherr muss amtsangemessenen Lebensunterhalt für Beamte und ihre Familien nach den verfassungsrechtlichen Maßstäben gewährleisten", "Nur Reisekosten werden ersetzt", "Es ist ein Tarifbonus"], 1, "Die amtsangemessene Alimentation gehört zu den hergebrachten Grundsätzen des Berufsbeamtentums und prägt Besoldung und Versorgung.", ["gg33", "bbesg"], 2),
        q("Woran knüpft das Grundgehalt im Bundesbesoldungsrecht typischerweise an?", ["An das verliehene Amt bzw. die Besoldungsgruppe und die gesetzliche Stufensystematik", "An tägliche Auktionen", "Nur an das Alter", "Nur an den Wohnort"], 0, "Die Besoldung folgt gesetzlich bestimmten Ämtern/Besoldungsgruppen und den dort geregelten Stufen- bzw. Erfahrungsmechanismen.", ["bbesg"], 3),
        q("Warum kann man die Besoldung eines Beamten nicht einfach per individuellem Arbeitsvertrag erhöhen?", ["Weil Beamte keine Leistung erbringen", "Weil die Besoldung dem Gesetzesvorbehalt und dem statusrechtlichen System unterliegt", "Weil Verträge in Deutschland verboten sind", "Weil nur Gewerkschaften Beamte bezahlen"], 1, "Statusbezogene Besoldungsansprüche entstehen aus Gesetz. Individuelle Abreden können die gesetzliche Besoldungsordnung nicht beliebig ersetzen.", ["bbesg", "gg33"], 4)
      ]
    },
    {
      id: "ii-02-versorgung",
      part: "Teil II · Besoldungs-, Versorgungs- und Disziplinarrecht",
      title: "Grundlagen der Beamtenversorgung",
      summary: "Ruhegehalt, ruhegehaltfähige Dienstzeit, Höchstsatz und Unfallfürsorge.",
      questions: [
        q("Wie hoch ist nach § 14 Abs. 1 BeamtVG der jährliche Steigerungssatz des Ruhegehalts beim Bund?", ["0,5 %", "1,79375 %", "5 %", "10 %"], 1, "Für jedes Jahr ruhegehaltfähiger Dienstzeit sieht § 14 Abs. 1 BeamtVG 1,79375 Prozent vor.", ["beamtvg"], 1),
        q("Wie hoch ist der reguläre Höchstruhegehaltssatz nach § 14 Abs. 1 BeamtVG?", ["50 %", "60 %", "71,75 %", "100 %"], 2, "Der gesetzliche Höchstsatz beträgt 71,75 Prozent der ruhegehaltfähigen Dienstbezüge.", ["beamtvg"], 2),
        q("Welche Größe ist für die Ruhegehaltsberechnung besonders relevant?", ["Ruhegehaltfähige Dienstzeit", "Anzahl privater Social-Media-Konten", "Parteimitgliedschaft", "Entfernung zur Dienststelle"], 0, "Versorgung knüpft unter anderem an ruhegehaltfähige Dienstbezüge und ruhegehaltfähige Dienstzeiten an.", ["beamtvg"], 3),
        q("Welche Aussage zur Versorgung ist richtig?", ["Bund und Länder müssen in jedem Detail identische Versorgungsgesetze haben", "Versorgungsrecht ist gesetzlich geregelt; für Bundes- und Landesbeamte können unterschiedliche Rechtsgrundlagen gelten", "Versorgung ist ausschließlich eine freiwillige Prämie", "Dienstunfälle spielen keine Rolle"], 1, "Das BeamtVG gilt für den Bund; Länder verfügen über eigenes Versorgungsrecht. Unfallfürsorge ist ein eigener gesetzlicher Versorgungsbereich.", ["beamtvg"], 4)
      ]
    },
    {
      id: "ii-03-disziplinarrecht",
      part: "Teil II · Besoldungs-, Versorgungs- und Disziplinarrecht",
      title: "Grundzüge des Disziplinarrechts",
      summary: "Dienstvergehen, Maßnahmen, Verfahren und die Bundesreform seit 1. April 2024.",
      questions: [
        q("Welche Maßnahme kennt das BDG für aktive Bundesbeamte?", ["Verweis", "Zwangsheirat", "Führerscheinentzug als Disziplinarmaßnahme", "Enteignung des Wohnhauses"], 0, "Das BDG nennt abgestufte Disziplinarmaßnahmen wie Verweis, Geldbuße, Kürzung der Dienstbezüge, Zurückstufung und Entfernung.", ["bdg"], 1),
        q("Was ist Zweck des Disziplinarrechts am ehesten?", ["Jede Straftat nochmals strafrechtlich bestrafen", "Auf schuldhafte Dienstpflichtverletzungen reagieren und Integrität/Funktionsfähigkeit des öffentlichen Dienstes sichern", "Private Vertragsstreitigkeiten lösen", "Steuern festsetzen"], 1, "Disziplinarrecht ist statusbezogenes Pflichtenrecht. Es ist vom Strafrecht zu unterscheiden, auch wenn Sachverhalte sich überschneiden können.", ["bdg", "bbg"], 2),
        q("Welche Aussage zum Verhältnis von Straf- und Disziplinarverfahren trifft zu?", ["Ein Freispruch beendet automatisch jedes denkbare Disziplinarverfahren", "Beide Verfahren haben unterschiedliche Zwecke; das BDG regelt ihre Koordination und Bindungswirkungen", "Disziplinarrecht gibt es nur ohne Strafrecht", "Nur das Strafgericht darf Dienstpflichten definieren"], 1, "Das BDG enthält Regeln zum Zusammentreffen mit Straf- oder Bußgeldverfahren und zu tatsächlichen Feststellungen. Die Rechtsgebiete bleiben funktional verschieden.", ["bdg"], 3),
        q("Was änderte sich im Bundesdisziplinarrecht für seit 1. April 2024 eingeleitete Verfahren besonders deutlich?", ["Disziplinarmaßnahmen wurden vollständig abgeschafft", "Auch statusrelevante Maßnahmen wie Zurückstufung, Entfernung und Aberkennung des Ruhegehalts werden grundsätzlich durch Disziplinarverfügung ausgesprochen; gerichtlicher Rechtsschutz bleibt möglich", "Nur Gerichte dürfen noch einen Verweis aussprechen", "Das BDG gilt seitdem nur für Arbeitnehmer"], 1, "Die Reform stellte die behördliche Disziplinarbefugnis um. § 33 BDG sieht Disziplinarverfügungen auch für statusrelevante Maßnahmen vor; § 85 enthält die Übergangsregel für vor dem 1. April 2024 eingeleitete Verfahren.", ["bdg"], 4)
      ]
    },
    {
      id: "iii-01-einfuehrung-arbeitsrecht",
      part: "Teil III · Arbeitsrecht",
      title: "Einführung in das Arbeitsrecht",
      summary: "Arbeitsvertrag, Arbeitnehmerstatus, öffentlicher Arbeitgeber und Rechtsweg.",
      questions: [
        q("Auf welcher Grundform beruht das Beschäftigungsverhältnis eines Tarifbeschäftigten?", ["Ernennungsurkunde", "Privatrechtlicher Arbeitsvertrag", "Disziplinarverfügung", "Planstelle allein"], 1, "Tarifbeschäftigte stehen in einem Arbeitsverhältnis; § 611a BGB beschreibt den Arbeitsvertrag und Arbeitnehmerbegriff.", ["bgb611a"], 1),
        q("Welche Gerichtsbarkeit ist für typische bürgerliche Rechtsstreitigkeiten zwischen Arbeitnehmern und Arbeitgebern aus dem Arbeitsverhältnis zuständig?", ["Arbeitsgerichtsbarkeit", "Finanzgerichtsbarkeit", "Verfassungsgericht ausschließlich", "Disziplinargericht"], 0, "Für individualarbeitsrechtliche Streitigkeiten ist grundsätzlich die Arbeitsgerichtsbarkeit zuständig.", ["arbgg"], 2),
        q("Kann Art. 33 Abs. 2 GG auch bei der Besetzung eines öffentlichen Amtes mit Tarifbeschäftigten Bedeutung haben?", ["Nein, Art. 33 Abs. 2 gilt nur für Pensionäre", "Ja; der Leistungsgrundsatz betrifft den Zugang zu öffentlichen Ämtern und kann auch Auswahlverfahren für Arbeitnehmerstellen im öffentlichen Dienst erfassen", "Nur wenn kein Arbeitsvertrag geschlossen wird", "Nur bei Ehrenbeamten"], 1, "Der Bewerbungsverfahrensanspruch aus Art. 33 Abs. 2 GG ist nicht auf klassische Beamtenstellen beschränkt, wenn ein öffentliches Amt besetzt wird.", ["gg33", "bgb611a"], 3),
        q("Warum ist der öffentliche Arbeitgeber trotz privatrechtlichem Arbeitsvertrag nicht einfach wie jeder private Arbeitgeber gestellt?", ["Weil er zusätzlich an öffentlich-rechtliche und verfassungsrechtliche Bindungen wie Art. 33 Abs. 2 GG gebunden sein kann", "Weil BGB und Arbeitsgerichte nie gelten", "Weil Tarifbeschäftigte automatisch Beamte werden", "Weil nur Landesrecht gilt"], 0, "Der Arbeitsvertrag ist privatrechtlich; die öffentliche Hand bleibt aber zugleich an Verfassung und öffentlich-rechtliche Organisationsbindungen gebunden.", ["gg33", "arbgg", "bgb611a"], 4)
      ]
    },
    {
      id: "iii-02-rechtsquellen-arbeitsrecht",
      part: "Teil III · Arbeitsrecht",
      title: "Rechtsquellen des Arbeitsrechts",
      summary: "Gesetz, Tarifvertrag, Arbeitsvertrag, Gleichbehandlung und Normenkonkurrenz.",
      questions: [
        q("Ist der TVöD ein Gesetz?", ["Ja, Bundesgesetz", "Nein, er ist ein Tarifvertrag", "Ja, Verfassungsrecht", "Nein, er ist eine Dienstanweisung"], 1, "Der TVöD beruht auf Tarifautonomie. Seine normative Wirkung richtet sich insbesondere nach dem TVG und der Tarifbindung bzw. vertraglicher Bezugnahme.", ["tvg"], 1),
        q("Welche Quelle enthält den allgemeinen gesetzlichen Begriff des Arbeitsvertrags/Arbeitnehmers?", ["§ 611a BGB", "§ 33 BDG", "Art. 79 GG", "§ 14 BeamtVG"], 0, "§ 611a BGB beschreibt die weisungsgebundene, fremdbestimmte Arbeit in persönlicher Abhängigkeit und die Vergütungspflicht des Arbeitgebers.", ["bgb611a"], 2),
        q("Welche Vorgabe macht § 11 AGG für Stellenausschreibungen?", ["Sie dürfen nicht unter Verstoß gegen das Benachteiligungsverbot ausgeschrieben werden", "Sie müssen immer nur intern erfolgen", "Sie dürfen Religion zwingend voraussetzen", "Sie sind im öffentlichen Dienst verboten"], 0, "Das AGG wirkt bereits bei der Ausschreibung: Arbeitsplätze dürfen nicht unter Verstoß gegen das Benachteiligungsverbot ausgeschrieben werden.", ["agg"], 3),
        q("Was ist bei mehreren arbeitsrechtlichen Rechtsquellen wichtig?", ["Immer gewinnt die längste Vorschrift", "Rang, Geltungsbereich, Tarifbindung und Spezial-/Günstigkeitsregeln müssen im konkreten Fall geprüft werden", "Der Arbeitsvertrag schlägt stets zwingendes Gesetz", "Dienstvereinbarungen können das Grundgesetz aufheben"], 1, "Arbeitsrecht ist ein Mehrebenensystem. Die konkrete Normwirkung hängt von Rang, Anwendungsbereich und besonderen Kollisionsregeln ab.", ["tvg", "bgb611a", "agg"], 4)
      ]
    },
    {
      id: "iii-03-tarifrecht",
      part: "Teil III · Arbeitsrecht",
      title: "Kollektives Arbeitsrecht (Tarifrecht)",
      summary: "Tarifvertragsparteien, Form, Tarifbindung, unmittelbare Wirkung und Nachwirkung.",
      questions: [
        q("Wer kann Tarifvertragspartei sein?", ["Gewerkschaften sowie Arbeitgeber oder Arbeitgebervereinigungen nach dem TVG", "Nur Gerichte", "Nur einzelne Arbeitnehmer", "Nur Personalräte"], 0, "Das TVG weist die Tariffähigkeit insbesondere Gewerkschaften und Arbeitgebern bzw. Vereinigungen von Arbeitgebern zu.", ["tvg"], 1),
        q("Welche Form verlangt § 1 Abs. 2 TVG für Tarifverträge?", ["Keine", "Schriftform", "Notarielle Beurkundung", "Mündliche Verkündung im Betrieb"], 1, "Tarifverträge bedürfen nach § 1 Abs. 2 TVG der Schriftform.", ["tvg"], 2),
        q("Wann gelten tarifliche Rechtsnormen nach § 4 Abs. 1 TVG unmittelbar und zwingend?", ["Immer weltweit", "Zwischen beiderseits Tarifgebundenen, die unter den Geltungsbereich des Tarifvertrags fallen", "Nur nach individueller Genehmigung durch das Amtsgericht", "Nie im öffentlichen Dienst"], 1, "Tarifbindung und Geltungsbereich sind für die normative Wirkung entscheidend; daneben kann ein Arbeitsvertrag Tarifrecht in Bezug nehmen.", ["tvg"], 3),
        q("Was bedeutet Nachwirkung nach § 4 Abs. 5 TVG?", ["Nach Tarifende verschwinden alle Normen sofort", "Nach Ablauf gelten die Rechtsnormen weiter, bis sie durch eine andere Abmachung ersetzt werden", "Der Tarifvertrag wird automatisch Gesetz", "Nur Arbeitgeber bleiben gebunden"], 1, "§ 4 Abs. 5 TVG verhindert ein sofortiges normatives Vakuum nach Tarifablauf und lässt die Regelungen bis zu einer anderen Abmachung nachwirken.", ["tvg"], 4)
      ]
    },
    {
      id: "iii-04-individualarbeitsrecht",
      part: "Teil III · Arbeitsrecht",
      title: "Individualarbeitsrecht",
      summary: "Arbeitsvertrag, Befristung, Pflichten, Kündigung und Rechtsfolgen unwirksamer Befristung.",
      questions: [
        q("Wie lange ist eine sachgrundlose kalendermäßige Befristung nach § 14 Abs. 2 TzBfG grundsätzlich zulässig?", ["6 Monate", "Bis zu 2 Jahre", "5 Jahre ohne weitere Voraussetzungen", "Unbegrenzt"], 1, "Grundsätzlich sind bis zu zwei Jahre und innerhalb dieser Gesamtdauer höchstens drei Verlängerungen vorgesehen; Tarifverträge können gesetzlich zugelassene Abweichungen regeln.", ["tzbfg"], 1),
        q("Welche Form verlangt § 14 Abs. 4 TzBfG für die Wirksamkeit der Befristung?", ["Schriftform", "Nur Handschlag", "Telefonat", "Keine Form"], 0, "Die Befristungsabrede bedarf zu ihrer Wirksamkeit der Schriftform.", ["tzbfg"], 2),
        q("Ist die Vertretung eines anderen Arbeitnehmers ein gesetzlich genannter möglicher Sachgrund für eine Befristung?", ["Nein", "Ja", "Nur bei Beamten", "Nur nach fünf Jahren"], 1, "§ 14 Abs. 1 TzBfG nennt die Vertretung ausdrücklich als Beispiel eines Sachgrunds.", ["tzbfg"], 3),
        q("Was ist die Grundfolge einer rechtsunwirksamen Befristung nach § 16 TzBfG?", ["Das Arbeitsverhältnis gilt grundsätzlich als auf unbestimmte Zeit geschlossen", "Der Arbeitnehmer wird Beamter", "Der Vertrag ist rückwirkend völlig bedeutungslos", "Es entsteht automatisch eine Geldbuße"], 0, "§ 16 TzBfG ordnet grundsätzlich ein unbefristetes Arbeitsverhältnis als Rechtsfolge der unwirksamen Befristung an.", ["tzbfg"], 4)
      ]
    },
    {
      id: "iii-05-personalvertretung-betriebsverfassung",
      part: "Teil III · Arbeitsrecht",
      title: "Personalvertretungs- und Betriebsverfassungsrecht",
      summary: "Personalrat im Bundesdienst, Betriebsrat-Abgrenzung und Beteiligungsrechte.",
      questions: [
        q("Welches Gesetz regelt die Personalvertretung in Verwaltungen des Bundes und bundesunmittelbaren Körperschaften, Anstalten und Stiftungen des öffentlichen Rechts?", ["BPersVG", "BetrVG allein", "AktG", "StGB"], 0, "§ 1 BPersVG bestimmt den Anwendungsbereich für den Bundesdienst.", ["bpersvg"], 1),
        q("Gilt das Betriebsverfassungsgesetz nach § 130 BetrVG für Verwaltungen und Betriebe des Bundes, der Länder, Gemeinden und sonstiger Körperschaften des öffentlichen Rechts?", ["Ja, immer", "Nein; für den öffentlichen Dienst greifen grundsätzlich die jeweiligen Personalvertretungsregelungen", "Nur sonntags", "Nur für Beamte"], 1, "§ 130 BetrVG grenzt den öffentlichen Dienst aus seinem Geltungsbereich aus. Dort ist typischerweise Personalvertretungsrecht einschlägig.", ["betrvg", "bpersvg"], 2),
        q("Kann das BPersVG durch Tarifvertrag oder Dienstvereinbarung beliebig abbedungen werden?", ["Ja", "Nein; § 3 BPersVG schließt abweichende Regelungen durch Tarifvertrag oder Dienstvereinbarung aus", "Nur durch mündliche Absprache", "Nur bei Personalratswahlen"], 1, "Das Bundespersonalvertretungsrecht enthält einen ausdrücklichen Ausschluss abweichender Regelungen durch Tarifvertrag oder Dienstvereinbarung.", ["bpersvg"], 3),
        q("Welche Aussage beschreibt den Unterschied Personalrat/Betriebsrat am besten?", ["Es sind zwei Wörter für exakt dasselbe Gesetz", "Personalräte sind die Interessenvertretung im personalvertretungsrechtlich erfassten öffentlichen Dienst; Betriebsräte beruhen auf dem BetrVG für dessen betrieblichen Anwendungsbereich", "Personalräte vertreten nur Beamte, niemals Arbeitnehmer", "Betriebsräte sind Gerichte"], 1, "Im öffentlichen Dienst werden sowohl Beamte als auch Arbeitnehmer von Personalvertretungsregeln erfasst. Das BetrVG und die Personalvertretungsgesetze haben unterschiedliche Anwendungsbereiche.", ["bpersvg", "betrvg"], 4)
      ]
    }
  ];

  window.QUIZ_DATA = {
    title: "Dienstrecht: Aktenlauf",
    subtitle: "Öffentliches Dienstrecht als 19-stufiges Quiz",
    structureNote: "Die Stage-Reihenfolge folgt der öffentlichen Inhaltsübersicht der 8. Auflage von Wichmann/Langer. Fragen und Erläuterungen sind neu formuliert und auf aktuelle bundesrechtliche Quellen aktualisiert.",
    legalAsOf: "Rechtsstand der verlinkten Bundesquellen: abgerufen September 2026. Landesrecht und Einzelfälle können abweichen.",
    sources,
    stages
  };
})();
