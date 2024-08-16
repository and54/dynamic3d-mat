
const { home_page, about_us, collections, resources, contact_us, certifications } = require('./translations');
const { initMap } = require('./geolocation');
const { ELanguages, ERegions, ENavigatorLanguages, ECountriesInRegion, ERegionIdMapping, ERegionVisibility } = require('./interfaces');
const { translateFooter } = require('./footer');
const { translateCareCopy, translateTimeline } = require('./translators');
const { setCookie, getCookie } = require('./utils');


const translatePage = (page, language, country, selectedRegion) => {
    let translations = page[language];
    let visibilityRegion = selectedRegion || ERegions.USA;

    if (page && translations)
        Object.entries(translations).forEach(([k, v]) => {
            if (k === 'history_copy_mad_alt_') {
                translateTimeline(v.text)
            } else if (k.includes('contact_form_interactive_fields')) {
                let el = $(`.${k}`).attr('placeholder', v.text);
                if (el && !el.length && v.text) {
                    console.log('NOT FOUND', k, v.text, v.visibility)
                }
            } else if (k.includes('care_cleaning_guide_copy_')) {
                // console.log(k, v)
                translateCareCopy(k, v)
            }
            else {
                let el;
                const visibilityArr = v.visibility.split(',').map(item => item.trim());
                const selectedRegionArr = ERegionVisibility[visibilityRegion] || [];
                const findSelectedRegion = findCommonElement(visibilityArr, selectedRegionArr);
                if (!v.visibility || findSelectedRegion) {
                    el = $(`#${k}`).html(v.text)
                } else {
                    $(`#${k}`).html('');
                }
                if (el && !el.length) {
                    // console.log(k, v.text, v.visibility)
                }
            }
        })

}

const translateContactUs = (page, language, country, selectedRegion = null) => {
    let region = selectedRegion || findRegion(country);
    let translations = page[language] && page[language][region || ERegions.USA]
    let officeAddressSec;
    let officeNumberSec;
    let officeEmailSec;
    let officeLabelsSec;
    // Preparing the office html elements.
    translations && translations.offices.forEach(office => {
        let address = office.address.join('<br>');
        let officeStr = `<div class="col-md-6 text-center text-md-left" >
        <h4 class="text-color-light font-weight-bold location-name">${office.name}</h4>
        <p class=" font-weight-light custom-text-size-1 pb-2 mb-4 contact-description-p">${address}</p>
        </div>`;
        officeAddressSec = officeAddressSec && `${officeAddressSec} ${officeStr}` || officeStr;
    });

    if (!selectedRegion) {
        page[language] && Object.keys(page[language]).forEach((el) => {
            const officelabelStr = `<option value="${el}">${el}</option>`;
            officeLabelsSec = officeLabelsSec && `${officeLabelsSec} ${officelabelStr}` || officelabelStr;
        });
        $('#location-select-sec').html(`<select id="location" name="location" class="contact-us-select">
        <option value="">Select Location</option>
        ${officeLabelsSec}
        </select>`);
    }

    // Changing the office address based on the language selected
    officeAddressSec && $('#office-address-section').html(officeAddressSec);

    //Preparing the phone number html elements
    translations && Object.entries(translations.numbers).forEach(([name, number]) => {
        let numberStrSec;
        number.forEach((el) => {
            let numberStr = `<a href="tel:${el}" class="text-color-light font-weight-medium contact-values">${el}</a><br>`
            numberStrSec = numberStrSec && `${numberStrSec} ${numberStr}` || numberStr;
        })
        let officeNumberStr = `<div class="feature-box-info contact-number-sec">
            <span class="d-block font-weight-medium contact-number-head">${name}</span>
            ${numberStrSec}
        </div>`
        officeNumberSec = officeNumberSec && `${officeNumberSec} ${officeNumberStr}` || officeNumberStr;
    });
    // Changing the phone number based on the language selected
    officeNumberSec && $('#contact-phone-numbers').html(officeNumberSec);
    //Preparing Email html element
    translations && translations.emails.forEach(email => {
        let officeEmailStr = `<a href="mailto:northamerica@nuvantglobal.com" class="text-color-light font-weight-medium contact-values">
        ${email}</a><br>`
        officeEmailSec = officeEmailSec && `${officeEmailSec} ${officeEmailStr}` || officeEmailStr;
    });
    $('#office-email-sec').html(officeEmailSec);
}

const findRegion = (country) => {
    let result = Object.entries(ECountriesInRegion).find(([region, countries]) => {
        return countries.find(c => c.includes(country))
    });
    return result && result[0];
}

const translateAll = (page, language, country, region = null) => {
    if (page && page.input_fields) {
        translateContactUs(page.locations, language, country)
        translatePage(page.input_fields, language, country, region)
    } else {
        translatePage(page, language, country, region)
    }
    translateFooter(language, country, region)
}

(function ($) {

    const page_match = {
        'index': home_page,
        'about-us': about_us,
        'collections': collections,
        'resources': resources,
        'contact': contact_us,
        'certifications': certifications,
        '/': home_page
    }

    window.initMap = initMap((country) => {
        localStorage.setItem('nuvant_country', country);
        let language = getLanguage();
        let region = localStorage.getItem('nuvant_region') || ERegions.USA;
        let page = Object.entries(page_match).find(([match]) => {
            return window.location.pathname.includes(match)
        })

        let translated_page = page && page[1];

        $('#header-load').load('../html/header.html', () => {
            $('#lang-es').click(function () {
                setLanguageInHeader(this);
                const region = localStorage.getItem('nuvant_region') || ERegions.USA;
                translateAll(translated_page, ELanguages.Spanish, country, region);
                setCookie(ELanguages.Spanish)
                init3d('./assets3d/');
                $(".lang-indentifier").removeClass("lang-selected");
                $(this).addClass("lang-selected");
                $(".form-error-label").hide();
            });
            $('#lang-en').click(function () {
                setLanguageInHeader(this);
                const region = localStorage.getItem('nuvant_region') || ERegions.USA;
                translateAll(translated_page, ELanguages.English, country, region);
                setCookie(ELanguages.English);
                init3d('./assets3d/');
                $(".lang-indentifier").removeClass("lang-selected");
                $(this).addClass("lang-selected");
                $(".form-error-label").hide();
            });
            $('#lang-de').click(function () {
                setLanguageInHeader(this);
                const region = localStorage.getItem('nuvant_region') || ERegions.USA;
                $(".lang-indentifier").removeClass("lang-selected");
                $(this).addClass("lang-selected");
                translateAll(translated_page, ELanguages.German, country, region);
                init3d('./assets3d/');
                setCookie(ELanguages.German);
                $(".form-error-label").hide();
            });

            $('.region-identifier').click(function () {
                setRegionInHeader(this)
                const regionId = $(this).attr('id');
                const lng = getCookie();
                const region = ERegionIdMapping[regionId];
                localStorage.setItem('nuvant_region', region || ERegions.USA);
                $(".region-identifier").removeClass("region-selected");
                $(this).addClass("region-selected");
                translateAll(translated_page, lng, country, region);
                $(".form-error-label").hide();
            });

            let selectedLang = localStorage.getItem('NUVANT_LANG');
            let selectedRegion = localStorage.getItem('nuvant_region');
            for (const [key, value] of Object.entries(ELanguages)) {
                if (language === value) {
                    selectedLang = key;
                }
            }
            setLanguageInHeader(null, selectedLang);
            setRegionInHeader(null, selectedRegion);
        });

        $('#footer').load('../html/footer.html', () => { translateFooter(language) });
        translateAll(translated_page, language, country, region)
    });
}).apply(this, [jQuery]);

function setLanguageInHeader(Obj, selected = null) {
    if (Obj || selected) {
        const langText = selected || $(Obj).text();
        $('.language-header-text').text(langText);
    }
}

function setRegionInHeader(Obj, selected = null) {
    if (Obj || selected) {
        const langText = selected || $(Obj).text();
        $('.global-header-text').text(langText);
    }
}

$(document).on('change', "#location", function () {
    const language = getLanguage();
    const country = localStorage.getItem('nuvant_country');
    const location = contact_us.locations;
    translateContactUs(location, language, country, this.value)
});

function getLanguage() {
    let language = 'en'
    let cookie = getCookie();
    if (cookie) {
        language = cookie
    } else if (window.navigator && navigator.language) {
        language = ENavigatorLanguages[navigator.language] || navigator.language
    }
    return language;
}

function findCommonElement(arr1, arr2) {
    return arr1.some(item => arr2.includes(item))
}

jQuery(function () {
});