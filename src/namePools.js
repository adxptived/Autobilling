// Autobilling billing profile data

var NAME_POOLS = {
  NL: {
    first: ['Lucas','Emma','Noah','Sophie','Daan','Anna','Milan','Lieke','Thomas','Sanne','Sem','Lisa','Jesse','Eva','Levi','Julia'],
    last: ['de Jong','Jansen','de Vries','van Dijk','Bakker','Visser','Smit','Meijer','de Boer','Mulder','Dekker','van Leeuwen'],
    streets: ['Kerkstraat','Schoolstraat','Molenweg','Dorpsstraat','Wilhelminastraat','Julianastraat','Prinsengracht','Keizersgracht','Herengracht','Lindelaan'],
    cities: ['Amsterdam','Rotterdam','Den Haag','Utrecht','Eindhoven','Groningen','Tilburg','Almere','Breda','Nijmegen'],
    zip: function () { var n = 1000 + Math.floor(Math.random()*9000); var l = ['AA','BB','CC','DD','EE','AB','CD','EF'][Math.floor(Math.random()*8)]; return n + ' ' + l; },
  },
  DE: {
    first: ['Lukas','Anna','Leon','Emilia','Paul','Lina','Jonas','Marie','Felix','Sophie'],
    last: ['Muller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Hoffmann','Schulz'],
    streets: ['Hauptstrasse','Schulstrasse','Bahnhofstrasse','Dorfstrasse','Ringstrasse','Birkenweg','Gartenstrasse','Bergstrasse','Lindenweg','Kirchstrasse'],
    cities: ['Berlin','Hamburg','Munchen','Koln','Frankfurt','Stuttgart','Dusseldorf','Leipzig','Dortmund','Essen'],
    zip: function () { return String(10000 + Math.floor(Math.random()*90000)); },
  },
  FR: {
    first: ['Lucas','Emma','Hugo','Lea','Louis','Chloe','Gabriel','Ines','Raphael','Camille'],
    last: ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau'],
    streets: ['Rue de la Paix','Avenue de France','Boulevard Saint-Germain','Rue du Faubourg','Place de la Republique'],
    cities: ['Paris','Marseille','Lyon','Toulouse','Nice','Nantes','Strasbourg','Montpellier','Bordeaux','Lille'],
    zip: function () { return String(75000 + Math.floor(Math.random()*20000)); },
  },
  GB: {
    first: ['Oliver','Jack','Harry','George','Charlie','Amelia','Olivia','Isla','Emily','Poppy'],
    last: ['Smith','Jones','Williams','Taylor','Brown','Davies','Evans','Wilson','Thomas','Roberts'],
    streets: ['High Street','Station Road','Church Lane','Mill Lane','Victoria Road','Green Lane','Park Road','Kings Road','The Avenue'],
    cities: ['London','Manchester','Birmingham','Leeds','Glasgow','Liverpool','Edinburgh','Bristol','Cardiff','Belfast'],
    zip: function () { var l = ['SW','NW','SE','NE','WC','EC','WN','M','B','L']; var n = 1 + Math.floor(Math.random()*20); var s = ['AA','BB','CC','DD','EE'][Math.floor(Math.random()*5)]; return l[Math.floor(Math.random()*l.length)] + n + ' ' + s; },
  },
  US: {
    first: ['James','John','Robert','Michael','Mary','Jennifer','Linda','Patricia','William','David'],
    last: ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez'],
    streets: ['Main St','Oak Ave','Elm St','Maple Dr','Cedar Ln','Pine Rd','Washington Blvd','Park Ave','Lake Dr','Hill St'],
    cities: ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','Austin'],
    zip: function () { return String(10000 + Math.floor(Math.random()*90000)); },
  },
  CA: {
    first: ['Liam','Emma','Noah','Olivia','Jackson','Sophia','Lucas','Ava','Benjamin','Mia'],
    last: ['Smith','Brown','Tremblay','Martin','Roy','Wilson','Macdonald','Johnson','Taylor','Anderson'],
    streets: ['King St','Queen St','Main St','Victoria St','Park Ave','Lake Drive','Mountain Rd','Bay Street','Church St','River Rd'],
    cities: ['Toronto','Vancouver','Montreal','Calgary','Ottawa','Edmonton','Winnipeg','Quebec','Hamilton','Halifax'],
    zip: function () { var l = ['A','B','C','E','G','H','J','K','L','M','N','P','R','S','T','V']; return l[Math.floor(Math.random()*l.length)] + Math.floor(Math.random()*10) + l[Math.floor(Math.random()*l.length)] + ' ' + Math.floor(Math.random()*10) + l[Math.floor(Math.random()*l.length)] + Math.floor(Math.random()*10); },
  },
  JP: {
    first: ['Haruto','Yuto','Sota','Yuki','Hayato','Sakura','Yuna','Akari','Miyu','Rin'],
    last: ['Sato','Suzuki','Takahashi','Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato'],
    streets: ['Chuo-dori','Meiji-dori','Showa-dori','Sakura-dori','Midori-dori'],
    cities: ['Tokyo','Osaka','Nagoya','Sapporo','Fukuoka','Kobe','Kyoto','Kawasaki','Saitama','Hiroshima'],
    zip: function () { return String(100 + Math.floor(Math.random()*900)) + '-' + String(1000 + Math.floor(Math.random()*9000)); },
  },
};

var DEFAULT_POOL = {
  first: ['Lucas','Emma','Noah','Sophie','Thomas','Anna','Milan','Lisa','Jesse','Eva'],
  last: ['Jansen','Visser','Smit','de Jong','Bakker','Meyer','Fischer','Weber','Wagner','Schneider'],
  streets: ['Hauptstrasse','Schulstrasse','Bahnhofstrasse','Dorfstrasse','Ringstrasse','Birkenweg','Gartenstrasse','Bergstrasse','Lindenweg','Kirchstrasse'],
  cities: ['Berlin','Paris','Madrid','Rome','Vienna','Bern','Stockholm','Oslo','Copenhagen','Helsinki'],
  zip: function () { return String(10000 + Math.floor(Math.random()*90000)); },
};

