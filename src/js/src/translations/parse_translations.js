

const csv = require('csv-parser');
const fs = require('fs');



let pages = {
    'home_page': {
        'en': 'home_page_en.csv',
        'es': 'home_page_sp.csv'
    },
    'about_us': {
        'en': 'about_us_en.csv',
        'es': 'about_us_sp.csv'
    },
    'collections': {
        'en': 'collections_en.csv',
        'es': 'collections_sp.csv'
    },
    'resources': {
        'en': 'resources_en.csv',
        'es': 'resources_sp.csv'
    },
    'contact_us': {
        'en': 'contact_us_en.csv',
        'es': 'contact_us_sp.csv'
    },
    'certifications': {
        'en': 'certifications_en.csv',
        'es': 'certifications_sp.csv'
    },
    'footer': {
        'en': 'footer_en.csv',
        'es': 'footer_sp.csv'
    },
}

const createTranslations = async (fileName, page_name, log = false) => {
    let headers = null;
    let currentSectionKey;
    let data = {};
    let colIdx = 0;
    console.log(`${__dirname}/raw/${page_name}/${fileName}`)
    return new Promise(res =>
        fs.createReadStream(`${__dirname}/raw/${page_name}/${fileName}`)
            .pipe(csv({ headers: false }))
            .on('data', (r) => {
                // if (log) console.log(r)
                let row = Object.values(r)
                // console.log(row.length, page_name, row, `${__dirname}/raw/${page_name}/${fileName}`)
                if (!row.length || row.every(i => !i)) {
                    // console.log('No Row')
                } else {

                let firstCol = row[0].trim()
                let sectionKey; 
                if (firstCol.includes('Section')) {
                    sectionKey = firstCol.split('-')[1]
                    if (log) {
                        console.log('sectionKey set', sectionKey);
                    }
                }
                //If first column matches column header, switch to new section w/ new headers
                if (sectionKey) {
                    //Assign new headers, if header doesn't exist, use header from old section
                    headers = Object.values(row).map((c, idx) => c.trim() || (headers ? headers[idx] : ''));
                    currentSectionKey = sectionKey;
                    data[currentSectionKey] = {}
                } else if (headers) { //else append the row to the current headers
                    let currentSection = data[currentSectionKey]
                    let rowName = row[0].toLowerCase().trim().replace(/\s/g, '_');
                    let visibility = '';
                    Object.values(row).forEach((r, idx) => {
                        if (idx) {
                            let currentColumn = headers[idx];
                            if (log) console.log(currentColumn)
                            if (currentColumn === 'Visibility') {
                                visibility = r
                                return;
                            } 
                            let elementPrefix = rowName.includes(currentSectionKey) ? rowName : currentSectionKey + ' ' + rowName
                            const elementName = `${elementPrefix} ${currentColumn}`
                                .toLowerCase()
                                .replace(/\s/g, '_')
                                .replace(/\W/g, '_')
                                .replace(/_+/g, '_')
                    
                            if (currentSection[elementName]) {
                                currentSection[elementName + '_' + colIdx] = { text: r, visibility }
                            } else {
                                currentSection[elementName] = {
                                    text: r, visibility
                                }
                            }
                        }
                    })
                    }
                }
                colIdx++
            })
            .on('end', async () => {
                let flatData = Object.values(data).reduce((acc, obj) => ({ ...acc, ...obj }), {})
                console.log('CSV file successfully processed', flatData);
                res(flatData);
            })
    )
}

const createPage = async (files, page_name, log = false) => {
    let translations = await Promise.all(
        Object.entries(files).map((async ([lang, file]) => {
            let translations = await createTranslations(file, page_name, log);
            return { lang, translations }
        }))
    )
    // console.log(translations)
    let parsed_translations = translations.reduce((obj, translations) => ({
        ...obj,
        [translations.lang]: translations.translations
    }), {})

    // console.log(parsed_translations)
    fs.writeFileSync(__dirname + '/parsed/' + `${page_name}.json`, JSON.stringify(parsed_translations));
}


(async () => {
    await createPage(pages['home_page'], 'home_page')
    await createPage(pages['about_us'], 'about_us')
    await createPage(pages['collections'], 'collections')
    await createPage(pages['resources'], 'resources')
    await createPage(pages['contact_us'], 'contact_us')
    await createPage(pages['footer'], 'footer')
    await createPage(pages['certifications'], 'certifications')

})();


