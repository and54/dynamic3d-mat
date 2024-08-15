const footer = require('./translations/parsed/footer.json');


const translateFooter = (language) => {
    Object.entries(footer[language]).forEach(([k, v]) => {
      let el;
      if (k.includes('footer_address')) {
        v.text.split('\n').forEach((a, idx) => {
          // console.log(`#${k}_${idx}`, a)
          $(`#${k}_${idx}`).html(a)
        })
      } else if (!v.visibility || v.visibility == 'América del Sur y América Central, México, Caribe') {
        el = $(`#${k}`).html(v.text)
      }
      if (el && !el.length) {
        console.log(k, v.text, v.visibility)
      }
    });
  }
  
  module.exports = {
      translateFooter
  }