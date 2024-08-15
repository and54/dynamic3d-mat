const fs = require('fs');

let colors = [`Bravia
Ice
Blanco Puro
Perla
Bond
Vainilla
Durazno
Apricot
Rojo Cereza
Mora
Vino
Verde Light
Verde Oscuro
Azul Oceano
Azul  
Azul Oscuro
Camel
Marron
Chocolate
Brownie
Gris Claro
Gris Ratón
Negro`
,
`Bravia Bic
Capuchino Bic
Bronce
Cobre
Crema Bic
Mocca
Naranja Bic
Plata
Tabaco`];

const init = () => 
  colors.map(s => {
    const cols = s.split('\n');
    const name = cols.shift();
    let resp = `{
      "id": "${clearSymbols(name)}",
      "section_id": "upholstery",
      "type": "render",
      "name": "${name.trim()}",
      "descriptionEN": "",
      "descriptionES": "",
      "descriptionGE": "",
      "certifications": [
        "IMO wheelmark",
 "PHTHALATE FREE Logo",
 "Sanitized Protection Logo",
 "OEKO TEX - Confidence in textiles Standard 100 Logo"
      ],
      "properties": [${
        cols.map(c => `{
          "id": "${clearSymbols(c)}",
          "name": "${c.trim()}"
        }`)
      }]
    }`
    const path = 'images/leather_goods/leather_goods';
    const matList = ['normal', 'roughness'/*, 'alpha'*/];
    const matName = 'nuvant_mat';
    resp = `{
      "id": "${clearSymbols(name)}",
      "section_id": "leather_goods",
      "type": "viewer-3d",
      "name": "${name.trim()}",
      "model": "${path}/model/model.fbx",
      "descriptionEN": "",
      "descriptionES": "",
      "descriptionGE": "",
      "certifications": [
        "U.V Radiation resistance symbol", 
        "Fire retardant symbol",
        "Mold and Mildew resistance symbol",
        "Cold Crack resistance symbol",
        "Waterproof symbol"
      ],
      "postLoad": [
        {
          "name": "${matName}",
          ${matList.map(m => 
            `"${m}Map": "${path}/${clearSymbols(name)}/${matName}_${m}map.jpg"`
          )}
        }
      ],
      "properties": [${
        cols.map(c => `{
          "id": "${clearSymbols(c)}",
          "name": "${c.trim()}",
          "materials": [
            {
              "name": "${matName}",
              "map": "${path}/${clearSymbols(name)}/${clearSymbols(c)}_${matName}_map.jpg"
            }
          ]
        }`)
      }]
    }`

    return resp.replace('\n', '');
  })

const clearSymbols = txt => txt.toLowerCase().trim()
  .replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '')
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/\s\s/g, ' ').replace(/\s/g, '_');

console.clear();
fs.writeFile('src/utils/test.json', init(), err => console.log(err || 'file created'));