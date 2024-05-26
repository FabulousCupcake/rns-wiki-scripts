const { decode } = require("html-entities");
const bot = require("nodemw");

const botConfig = require("./config.json");
const client = new bot(botConfig);

// Get all Loot [name, icon] from Cargo
const fetchFromCargo = async () => {
  process.stdout.write("Fetching loots JSON from Cargo... ");
  const url = "https://rns.miraheze.org/wiki/Special:CargoExport?tables=loots%2C&&fields=loots.name%2C+loots.icon%2C&&order+by=&limit=500&format=json";
  const resp = await fetch(url, {
    headers: {
      "User-Agent": botConfig.userAgent,
    },
  });
  const json = await resp.json();

  console.log("✅");
  return json
}

// Login wrapper cuz horrible callbacks
const initWikiClient = async () => {
  process.stdout.write("Initializing wiki client... ");
  return new Promise((resolve, reject) => {
    client.logIn(botConfig.username, botConfig.password, (err, data) => {
      if (err) reject(err);
      console.log("✅");
      resolve();
    });
  });
}


// Main
const main = async () => {
  await initWikiClient();

  // Get loot name:icon map from cargotable
  const itemJson = await fetchFromCargo();


  // Create redirects
  // [[File: Name.png]] --> spr_hbs_... asset name
  console.log("Creating redirects...")
  for (const item of itemJson) {
    const name = decode(item.name);
    const pageName = `File:${name}.png`;
    process.stdout.write(`⏳ ${pageName}\r`);

    const content = `#REDIRECT [[File:${item.icon}]]`;
    const summary = "Create redirect";
    const isMinorEdit = false;

    // Send it
    await (async function() {
      return new Promise((resolve, reject) => {
        client.edit(pageName, content, summary, isMinorEdit, (err, data) => {
          if (err) {
            console.log(`× ${pageName}`);
            reject(err)
          } else {
            console.log(`✅ ${pageName}`);
            resolve(data);
          }
        });
      });
    })();
  };
}

main();