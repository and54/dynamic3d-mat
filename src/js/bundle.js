(function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o } return r })()({
    1: [function (require, module, exports) {
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
    }, { "./translations/parsed/footer.json": 11 }], 2: [function (require, module, exports) {
        module.exports.initMap = (cb) => async () => {
            if (navigator.geolocation) {

                const success = res => (pos) => {
                    var crd = pos.coords;
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ location: { lat: crd.latitude, lng: crd.longitude } }, (results, status) => {
                        if (status === "OK") {
                            if (results.length) {
                                let country_results = results.find(r => r.types.includes('country'));
                                let country = country_results.formatted_address
                                res(country);
                            } else {
                                window.alert("No results found");
                            }
                        } else {
                            window.alert("Geocoder failed due to: " + status);
                        }
                    });
                }

                const error = rej => (err) => {
                    console.warn(`ERROR(${err.code}): ${err.message}`);
                    // rej(err);
                    cb(null);
                }

                let res = await new Promise((res, rej) => {
                    navigator.geolocation.getCurrentPosition(success(res), error(rej));
                })

                cb(res)
            } else {
                return null
            }
        }
    }, {}], 3: [function (require, module, exports) {

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
    }, { "./footer": 1, "./geolocation": 2, "./interfaces": 4, "./translations": 5, "./translators": 14, "./utils": 15 }], 4: [function (require, module, exports) {

        const ERegions = {
            LATAM: 'América del Sur y América Central, México, Caribe',
            USA: 'USA & Canada',
            Europe: 'Europe',
            Global: 'Global'
        }

        const ERegionVisibility = {
            [ERegions.LATAM]: [ERegions.LATAM, ERegions.USA],
            [ERegions.USA]: [ERegions.USA, ERegions.Europe],
            [ERegions.Europe]: [ERegions.Europe, ERegions.USA],
            [ERegions.Global]: [ERegions.USA, ERegions.Europe]
        }

        const ECountriesInRegion = {
            [ERegions.USA]: ['United States', 'Canada']
        }

        const ELanguages = {
            English: 'en',
            Spanish: 'es',
            German: 'de'
        }

        const ENavigatorLanguages = {
            'en-US': ELanguages.English,
            'sp': ELanguages.Spanish,
        }

        const ERegionIdMapping = {
            'region-us': 'USA & Canada',
            'region-europe': 'Europe',
            'region-latam': 'LATAM',
            'region-global': 'Global',
            'region-na': 'North America',
            'region-nafrica': 'North Africa',
            'region-me': 'Middle East',
            'region-sa': 'South America',
            'region-ru': 'Russia',
        }

        module.exports = {
            ERegions,
            ELanguages,
            ERegionVisibility,
            ENavigatorLanguages,
            ECountriesInRegion,
            ERegionIdMapping
        }

    }, {}], 5: [function (require, module, exports) {

        const home_page = require('./parsed/home_page.json');
        const about_us = require('./parsed/about_us.json');
        const collections = require('./parsed/collections.json');
        const resources = require('./parsed/resources.json');
        const contact_us = require('./parsed/contact_us.json');
        const contact_us_2 = require('./parsed/contact_us_2.json')
        const certifications = require('./parsed/certifications.json');


        module.exports = {
            home_page,
            about_us,
            collections,
            resources,
            contact_us: { locations: contact_us_2, input_fields: contact_us },
            certifications
        }
    }, { "./parsed/about_us.json": 6, "./parsed/certifications.json": 7, "./parsed/collections.json": 8, "./parsed/contact_us.json": 9, "./parsed/contact_us_2.json": 10, "./parsed/home_page.json": 12, "./parsed/resources.json": 13 }], 6: [function (require, module, exports) {
        module.exports = {
            "en": {
                "about_us_section_name": {
                    "text": "ABOUT US",
                    "visibility": ""
                },
                "about_us_image": {
                    "text": "Image #1 company logo and company picture",
                    "visibility": ""
                },
                "about_us_header": {
                    "text": "A global company dedicated to the design and manufacturing of coated textiles.",
                    "visibility": ""
                },
                "about_us_subheader": {
                    "text": "Your reliable partner dedicated to the highest quality of material and service.\n",
                    "visibility": ""
                },
                "about_us_copy_one": {
                    "text": "Nuvant serves different markets worldwide and is constantly striving to develop new products and solutions. Our products are powerful and can be used for a wide range of applications, meeting the requirements of the respective markets.",
                    "visibility": ""
                },
                "about_us_copy_two": {
                    "text": "Our greatest strength is the relationship with our clients together with a team of highly trained people working towards excellence and the highest quality standards.",
                    "visibility": ""
                },
                "history_section_name": {
                    "text": "HISTORY",
                    "visibility": ""
                },
                "history_image": {
                    "text": "Image #1",
                    "visibility": ""
                },
                "history_header": {
                    "text": "",
                    "visibility": ""
                },
                "history_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "history_copy_mad_alt_": {
                    "text": "Our history\n\nSince its launch in 1966, Nuvant has evolved from a small business into a trusted global supplier bolstered by a robust network of facilities and distributors strategically located worldwide.\n\n1966\nThe company launches as a commercial printer.\n\n1968 \nVinyl coated fabrics become a part of our product catalog.\n\n1987 \nNew cast coating technology is implemented.\n\n1992\nIndustrial and commercial collections go international.\n\n2002\nAutomotive aftermarket and contract collections introduced in North America through partner distributors.\n\n2004\nSubstantial growth experienced in the U.S. and Spanish markets.\n\n2005 \nStarted to ship Automotive OEM materials to North America.\n\n2009 \nState-of-the-art plastisol preparation facility inaugurated.\n\n2015\nNew Europe division offices open their doors in Germany.\n\n2018\nSpain's office opened to strengthen European presence.\n\n2020\nOur brand is refreshed to accommodate our new scope and align all locations under a single name. Millennium International, Quinetica, Millennium Products of America, Riegel Productos de Mexico, and Plastiquimica are now Nuvant. ",
                    "visibility": ""
                },
                "statistics_section_name": {
                    "text": "-",
                    "visibility": ""
                },
                "statistics_business_years": {
                    "text": "54",
                    "visibility": ""
                },
                "statistics_clients": {
                    "text": "400+",
                    "visibility": ""
                },
                "statistics_continents": {
                    "text": "3",
                    "visibility": ""
                },
                "statistics_employees": {
                    "text": "400+",
                    "visibility": ""
                },
                "sustainability_section_name": {
                    "text": "SUSTAINABILITY",
                    "visibility": ""
                },
                "sustainability_image": {
                    "text": "Image #1",
                    "visibility": ""
                },
                "sustainability_header": {
                    "text": "Our commitment to sustainability",
                    "visibility": ""
                },
                "sustainability_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "sustainability_copy": {
                    "text": "Nuvant is committed to designing and manufacturing innovative coated textiles while working in harmony with the environment. For this reason, we have invested in state-of-the-art emission control technologies that allow us to operate well below the required emission limits. \n\nOur multidisciplinary team, which includes third-party advisors well-versed in regulatory requirements and best practices for reducing energy and water usage, is keen on enforcing innovative strategies to recycle and reuse as many resources as possible throughout our production pipeline. \n\nThroughout the years, our product portfolio has evolved from solvent-based formulations to more sustainable water-based formulations. As of August of 2020, Nuvant offers phthalate-free, biocide-free, and FR-free coated fabric. Our manufacturing plant is also now DEHP-free. ",
                    "visibility": ""
                },
                "footer_headquarters": {
                    "text": "Headquarters\nCL 61 Sur N. 43 A – 290\nSabaneta, Antioquia 055450\nColombia",
                    "visibility": ""
                },
                "footer_contact": {
                    "text": "(create link to contact section)",
                    "visibility": ""
                },
                "footer_links": {
                    "text": "Home",
                    "visibility": ""
                },
                "footer_social_media_channels": {
                    "text": "Facebook",
                    "visibility": ""
                },
                "footer_copy": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_14": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_14": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_14": {
                    "text": "About",
                    "visibility": ""
                },
                "footer_social_media_channels_14": {
                    "text": "Twitter",
                    "visibility": ""
                },
                "footer_copy_14": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_15": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_15": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_15": {
                    "text": "Collections",
                    "visibility": ""
                },
                "footer_social_media_channels_15": {
                    "text": "Instagram",
                    "visibility": ""
                },
                "footer_copy_15": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_16": {
                    "text": "Resources",
                    "visibility": ""
                },
                "footer_social_media_channels_16": {
                    "text": "Linkedin",
                    "visibility": ""
                },
                "footer_copy_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_17": {
                    "text": "Terms & Conditions ",
                    "visibility": ""
                },
                "footer_social_media_channels_17": {
                    "text": "YouTube",
                    "visibility": ""
                },
                "footer_copy_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_18": {
                    "text": "Privacy Policy",
                    "visibility": ""
                },
                "footer_social_media_channels_18": {
                    "text": "social@nuvantglobal.com",
                    "visibility": ""
                },
                "footer_copy_18": {
                    "text": "",
                    "visibility": ""
                }
            },
            "es": {
                "about_us_section_name": {
                    "text": "\nQUIÉNES SOMOS",
                    "visibility": ""
                },
                "about_us_image": {
                    "text": "Image #1 company logo and company picture",
                    "visibility": ""
                },
                "about_us_header": {
                    "text": "Una empresa global dedicada al diseño y la fabricación de textiles recubiertos.",
                    "visibility": ""
                },
                "about_us_subheader": {
                    "text": "Su socio confiable, enfocado en ofrecer la más alta calidad y servicio.",
                    "visibility": ""
                },
                "about_us_copy_one": {
                    "text": "Nuvant atiende a los diferentes mercados alrededor del mundo y se esfuerza constantemente por desarrollar nuevos productos y soluciones. Nuestros productos son de excelente calidad y durabilidad y pueden ser usados en una amplia gama de aplicaciones, cumpliendo con los requisitos de los respectivos mercados.\nNuestra mayor fortaleza es la relación con nuestros clientes, junto a un equipo de personas altamente capacitadas que trabajan enfocados en la excelencia y los más altos estándares de calidad. ",
                    "visibility": ""
                },
                "about_us_copy_two": {
                    "text": "Nuvant atiende a los diferentes mercados alrededor del mundo y se esfuerza constantemente por desarrollar nuevos productos y soluciones. Nuestros productos son de excelente calidad y durabilidad y pueden ser usados en una amplia gama de aplicaciones, cumpliendo con los requisitos de los respectivos mercados.\nNuestra mayor fortaleza es la relación con nuestros clientes, junto a un equipo de personas altamente capacitadas que trabajan enfocados en la excelencia y los más altos estándares de calidad. ",
                    "visibility": ""
                },
                "history_section_name": {
                    "text": "\nHISTORIA",
                    "visibility": ""
                },
                "history_image": {
                    "text": "Image #1",
                    "visibility": ""
                },
                "history_header": {
                    "text": "",
                    "visibility": ""
                },
                "history_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "history_copy_mad_alt_": {
                    "text": "Nuestra historia\n\nDesde su fundación en 1966, Nuvant ha evolucionado constantemente hasta convertirse en un proveedor global de confianza, respaldado por una sólida red de distribuidores estratégicamente ubicados en tres continentes. \n\n1966\nLa empresa se crea bajo el nombre Plastiquímica, con el objetivo de servir al mercado de impresión comercial.\n\n1968\nSe incorporan textiles recubiertos de vinilo al catálogo de productos.\n\n1987\nSe implementa una nueva tecnología de recubrimiento.\n\n1992\nLa empresa comienza exportaciones y se internacionalizan las colecciones industriales y comerciales. Las colecciones industriales y comerciales se internacionalizan.\n\n2002\nSe introducen colecciones de tapicería automotriz de reposición y tapicería contract en Estados Unidos a través de distribuidores asociados.\n\n2004\nLa empresa crece substancialmente en los mercados de Estados Unidos y España\n\n2005 \nComienzan exportaciones de tapicería automotriz OEM hacia Norteamérica.\n\n\n2009 \nSe inaugura la planta de preparación de plastisoles de última tecnología.\n\n2015\nSe crea la división Europea, con oficinas en Alemania.\n\n2018\nSe inaugura la oficina de España para fortalecer la presencia en Europa.\n\n2020\nLa marca principal Plastiquimica es renovada con el fin de ajustarse a un nuevo enfoque estratégico y alinear todas las marcas de distribución internacional bajo un solo nombre.  Millennium Products of America en Estados Unidos, Quinética Ibérica en España, Millennium International en Alemania y Riegel Products de México, empiezan a ser reconocidas bajo el nombre: Nuvant.",
                    "visibility": ""
                },
                "statistics_section_name": {
                    "text": "-",
                    "visibility": ""
                },
                "statistics_business_years": {
                    "text": "54",
                    "visibility": ""
                },
                "statistics_clients": {
                    "text": "400+",
                    "visibility": ""
                },
                "statistics_continents": {
                    "text": "3",
                    "visibility": ""
                },
                "statistics_employees": {
                    "text": "400+",
                    "visibility": ""
                },
                "sustainability_section_name": {
                    "text": "\nSOSTENIBILIDAD",
                    "visibility": ""
                },
                "sustainability_image": {
                    "text": "Image #1",
                    "visibility": ""
                },
                "sustainability_header": {
                    "text": "\nNuestro compromiso con la sostenibilidad",
                    "visibility": ""
                },
                "sustainability_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "sustainability_copy": {
                    "text": "Nuvant está comprometida con el diseño y fabricación de textiles recubiertos innovadores, al mismo tiempo que trabaja en armonía con el medio ambiente. Por esta razón, hemos invertido en tecnologías de control de emisiones de última generación, lo cual nos permite operar muy por debajo de los límites de emisión requeridos. \nNuestro equipo multidisciplinario, que incluye consultores externos expertos en temas regulatorios y mejores prácticas para reducir el uso de energía y agua, está enfocado en la implementación de estrategias innovadoras para reciclar y reusar la mayor cantidad de recursos posible a través del proceso productivo. \nA lo largo de los años, nuestra oferta de productos ha evolucionado desde el uso de formulaciones basadas en solventes a unas más sostenibles basadas en agua. Desde agosto del 2020, Nuvant ofrece dentro de su portafolio textiles recubiertos libres de ftalato y de biocidas, características retardadores al fuego. Nuestra planta de manufactura es libre de DEHP.",
                    "visibility": ""
                },
                "footer_headquarters": {
                    "text": "Oficina principal\nCL 61 Sur N. 43 A – 290\nSabaneta, Antioquia 055450\nColombia\nOficinas centrales",
                    "visibility": ""
                },
                "footer_contact": {
                    "text": "(create link to contact section)",
                    "visibility": ""
                },
                "footer_link": {
                    "text": "\nInicio",
                    "visibility": ""
                },
                "footer_social_media_channels": {
                    "text": "Facebook",
                    "visibility": ""
                },
                "footer_copy": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_14": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_14": {
                    "text": "",
                    "visibility": ""
                },
                "footer_link_14": {
                    "text": "\nQuiénes Somos",
                    "visibility": ""
                },
                "footer_social_media_channels_14": {
                    "text": "Twitter",
                    "visibility": ""
                },
                "footer_copy_14": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_15": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_15": {
                    "text": "",
                    "visibility": ""
                },
                "footer_link_15": {
                    "text": "\nColecciones",
                    "visibility": ""
                },
                "footer_social_media_channels_15": {
                    "text": "Instagram",
                    "visibility": ""
                },
                "footer_copy_15": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_link_16": {
                    "text": "\nRecursos",
                    "visibility": ""
                },
                "footer_social_media_channels_16": {
                    "text": "Linkedin",
                    "visibility": ""
                },
                "footer_copy_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_link_17": {
                    "text": "\nPolítica de Tratamiento de Datos",
                    "visibility": ""
                },
                "footer_social_media_channels_17": {
                    "text": "YouTube",
                    "visibility": ""
                },
                "footer_copy_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_link_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_social_media_channels_18": {
                    "text": "social@nuvantglobal.com",
                    "visibility": ""
                },
                "footer_copy_18": {
                    "text": "",
                    "visibility": ""
                }
            }
        }
    }, {}], 7: [function (require, module, exports) {
        module.exports = {
            "en": {
                "contact_cta": {
                    "text": "Get in Contact",
                    "visibility": ""
                },
                "contact_copy": {
                    "text": "Order a sample swatch from one of our collections today.",
                    "visibility": ""
                },
                "contact_header": {
                    "text": "Experience the difference",
                    "visibility": ""
                },
                "contact_section_name": {
                    "text": "GET IN TOUCH",
                    "visibility": ""
                },
                "certifications_section_name": {
                    "text": "Certifications",
                    "visibility": ""
                },
                "certifications_copy": {
                    "text": "Nuvant is committed to the quality of its products and processes, through its quality management system certified by the SGS leading global certification body.  <br><br>\n\nHaving a quality management system and a valuable working group, allows the company to maintain a continuous improvement aimed at satisfying the requirements of its customers in each sector and demonstrating compliance with certifiable quality standards:",
                    "visibility": ""
                },
                "certifications_logo": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_": {
                    "text": "Quality you can Trust",
                    "visibility": ""
                },
                "certifications__1": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_section_name": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_header": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_logo": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_copy": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_1_section_name": {
                    "text": "-",
                    "visibility": ""
                },
                "certifications_list_1_header": {
                    "text": "ISO 9001: 2015 Standard ",
                    "visibility": ""
                },
                "certifications_list_1_logo": {
                    "text": "Logo of ISO 9001",
                    "visibility": ""
                },
                "certifications_list_1_subheader": {
                    "text": "QUALITY MANAGEMENT SYSTEM",
                    "visibility": ""
                },
                "certifications_list_1_copy": {
                    "text": "Nuvant's ISO 9000 certification ensures we are always following a set of quality management standards throughout all of our design and manufacturing processes, in order to meet our customers needs within the requirements related to our coated textiles",
                    "visibility": ""
                },
                "certifications_list_1_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_2_section_name": {
                    "text": "-",
                    "visibility": ""
                },
                "certifications_list_2_header": {
                    "text": "IATF Standard: 16949: 2016 ",
                    "visibility": ""
                },
                "certifications_list_2_logo": {
                    "text": "Logo of IATF 16949",
                    "visibility": ""
                },
                "certifications_list_2_subheader": {
                    "text": "AUTOMOTIVE QUALITY MANAGEMENT SYSTEM",
                    "visibility": ""
                },
                "certifications_list_2_copy": {
                    "text": "Nuvant is proud to be IATF 16949 certified. This certification defines requirements of a quality management system for organizations that supply parts to the demanding automotive industry",
                    "visibility": ""
                },
                "certifications_list_2_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_3_section_name": {
                    "text": "-",
                    "visibility": ""
                },
                "certifications_list_3_header": {
                    "text": "BASC Certificate (Business Alliance For Secure Commerce)",
                    "visibility": ""
                },
                "certifications_list_3_logo": {
                    "text": "Logo of Basc",
                    "visibility": ""
                },
                "certifications_list_3_subheader": {
                    "text": "BUSINESS ALLIANCE FOR SECURE COMMERCE CERTIFICATION",
                    "visibility": ""
                },
                "certifications_list_3_copy": {
                    "text": "Nuvant is a BASC Certified Company. The Business Alliance for Secure Commerce (BASC) is an international business alliance, created to promote safe international trade in cooperation with governments and international organizations.",
                    "visibility": ""
                },
                "certifications_list_3_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_4_section_name": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_4_header": {
                    "text": "Marine Equipment Directive 2014/90/EU (Annex II Module D) Certificate",
                    "visibility": ""
                },
                "certifications_list_4_logo": {
                    "text": "Logo of Approved AMS (LR)",
                    "visibility": ""
                },
                "certifications_list_4_subheader": {
                    "text": "MARINE EQUIPMENT SAFETY MANAGEMENT SYSTEM",
                    "visibility": ""
                },
                "certifications_list_4_copy": {
                    "text": "Specific Nuvant collections have been certified to comply with Marine Equipment Directive (MED) 2014/90/EU (Annex II Module D) for upholstery materials, assuring applicability of these products in the marine industry. ",
                    "visibility": ""
                },
                "certifications_list_4_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_contact_section_section_name": {
                    "text": "Section Name",
                    "visibility": ""
                },
                "certifications_list_contact_section_header": {
                    "text": "Image",
                    "visibility": ""
                },
                "certifications_list_contact_section_logo": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_contact_section_subheader": {
                    "text": "Header",
                    "visibility": ""
                },
                "certifications_list_contact_section_copy": {
                    "text": "Copy",
                    "visibility": ""
                },
                "certifications_list_contact_section_cta": {
                    "text": "CTA",
                    "visibility": ""
                },
                "certifications_list_section_name": {
                    "text": "GET IN TOUCH",
                    "visibility": ""
                },
                "certifications_list_header": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_logo": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_subheader": {
                    "text": "Experience the difference",
                    "visibility": ""
                },
                "certifications_list_copy": {
                    "text": "Order a sample swatch from one of our collections today.",
                    "visibility": ""
                },
                "certifications_list_cta": {
                    "text": "Get in Contact",
                    "visibility": ""
                }
            },
            "es": {
                "contact_cta": {
                    "text": "\nContáctenos ",
                    "visibility": ""
                },
                "contact_copy": {
                    "text": "Solicite hoy una muestra",
                    "visibility": ""
                },
                "contact_section_name": {
                    "text": "\nCONTÁCTENOS",
                    "visibility": ""
                },
                "contact_header": {
                    "text": "Experimenta nuestra tecnología",
                    "visibility": ""
                },
                "certifications_nombre_de_secci_n": {
                    "text": "Certificaciones",
                    "visibility": ""
                },
                "certifications_copy": {
                    "text": "Nuvant está comprometida con la calidad de sus productos y procesos, cuenta con un sistema de Gestión de Calidad, certificado por el organismo líder de certificación mundial SGS.<br><br> Tener un sistema de Gestión de Calidad y un valioso equipo de trabajo le permite a la compañía mantener una mejora continua, orientada a la satisfacción de los requerimientos de nuestros clientes en cada sector y por el cumplimiento de las normas de Calidad:",
                    "visibility": ""
                },
                "certifications_logo": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_": {
                    "text": "\nCalidad que puedes confiar",
                    "visibility": ""
                },
                "certifications__1": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_section_name": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_header": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_logo": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_copy": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_certificate_numbers_name_link_pdf_removed_we_are_not_carrying_this_over_to_the_new_site_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_1_section_name": {
                    "text": "-",
                    "visibility": ""
                },
                "certifications_list_1_header": {
                    "text": "ISO 9001: 2015 Standard ",
                    "visibility": ""
                },
                "certifications_list_1_logo": {
                    "text": "Logo of ISO 9001",
                    "visibility": ""
                },
                "certifications_list_1_subheader": {
                    "text": "SISTEMA DE GESTIÓN DE LA CALIDAD",
                    "visibility": ""
                },
                "certifications_list_1_copy": {
                    "text": "La certificación ISO 9000 de Nuvant garantiza que trabajamos bajo un sistema de gestión de calidad en todos nuestros procesos de diseño y fabricación de telas recubiertas, con el objetivo de satisfacer las necesidades de nuestros clientes, cumpliendo los requerimientos del mercado. ",
                    "visibility": ""
                },
                "certifications_list_1_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_2_section_name": {
                    "text": "-",
                    "visibility": ""
                },
                "certifications_list_2_header": {
                    "text": "IATF Standard: 16949: 2016 ",
                    "visibility": ""
                },
                "certifications_list_2_logo": {
                    "text": "Logo of IATF 16949",
                    "visibility": ""
                },
                "certifications_list_2_subheader": {
                    "text": "\nSISTEMA DE GESTIÓN DE LA CALIDAD AUTOMOTRIZ",
                    "visibility": ""
                },
                "certifications_list_2_copy": {
                    "text": "Nuvant se enorgullece de tener la certificación IATF 16949, la cual define los requerimientos de un sistema de gestión de calidad en las organizaciones proveedoras de produtos para la industria automotriz.",
                    "visibility": ""
                },
                "certifications_list_2_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_3_section_name": {
                    "text": "-",
                    "visibility": ""
                },
                "certifications_list_3_header": {
                    "text": "Certificado BASC (Business Alliance For Secure Commerce )\n",
                    "visibility": ""
                },
                "certifications_list_3_logo": {
                    "text": "Logo of Basc\n",
                    "visibility": ""
                },
                "certifications_list_3_subheader": {
                    "text": "SISTEMA DE GESTIÓN EN CONTROL Y SEGURIDAD\n",
                    "visibility": ""
                },
                "certifications_list_3_copy": {
                    "text": "Nuvant es una compañía certificada BASC. Business Alliance for Secure Commerce, por sus siglas en inglés BASC, es una empresa que establece una alianza comercial para promover el comercio internacional seguro, en cooperación con gobiernos y organizaciones internacionales.",
                    "visibility": ""
                },
                "certifications_list_3_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_4_section_name": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_4_header": {
                    "text": "\nCertificado de la Directiva de Equipos Marinos 2014/90 / UE (Anexo II, Módulo D)",
                    "visibility": ""
                },
                "certifications_list_4_logo": {
                    "text": "Logo of Approved AMS (LR)\n",
                    "visibility": ""
                },
                "certifications_list_4_subheader": {
                    "text": "SISTEMA DE GESTIÓN EN CONTROL DE SEGURIDAD EN EQUIPOS MARINOS",
                    "visibility": ""
                },
                "certifications_list_4_copy": {
                    "text": "Colecciones específicas de Nuvant han sido certificadas por cumplir con la Marine Equipment Directive (MED) 2014/90 / EU (Anexo II Módulo D) para materiales de tapicería en la industria marina.",
                    "visibility": ""
                },
                "certifications_list_4_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_contact_section_section_name": {
                    "text": "Section Name\t",
                    "visibility": ""
                },
                "certifications_list_contact_section_header": {
                    "text": "Image",
                    "visibility": ""
                },
                "certifications_list_contact_section_logo": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_contact_section_subheader": {
                    "text": "Header",
                    "visibility": ""
                },
                "certifications_list_contact_section_copy": {
                    "text": "Copy",
                    "visibility": ""
                },
                "certifications_list_contact_section_cta": {
                    "text": "CTA",
                    "visibility": ""
                },
                "certifications_list_section_name": {
                    "text": "CONTÁCTENOS",
                    "visibility": ""
                },
                "certifications_list_header": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_logo": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_list_subheader": {
                    "text": "Experimenta nuestra tecnología",
                    "visibility": ""
                },
                "certifications_list_copy": {
                    "text": "Ordene hoy una muestra",
                    "visibility": ""
                },
                "certifications_list_cta": {
                    "text": "\nContáctenos",
                    "visibility": ""
                }
            }
        }
    }, {}], 8: [function (require, module, exports) {
        module.exports = { "en": { "pfa_pfa_1_section_name": { "text": "COLLECTION", "visibility": "" }, "pfa_pfa_1_image_insert_image_or_reference_": { "text": "Automotive interior upholstery high quality Image", "visibility": "" }, "pfa_pfa_1_header": { "text": "Automotive", "visibility": "" }, "pfa_pfa_1_copy": { "text": "Choose from our selection of premium products, designed to meet the strict specifications and demands of the industry in terms of quality, durability and safety.", "visibility": "" }, "pfa_pfa_1_cta": { "text": "View More", "visibility": "" }, "pfa_pfa_1_region": { "text": " USA & Canada,  LATAM South America and Central América , México , Caribean", "visibility": "" }, "pfa_pfa_2_section_name": { "text": "COLLECTION", "visibility": "" }, "pfa_pfa_2_image_insert_image_or_reference_": { "text": "Contract Upholstery: Hospitality lobby focused on uphostery", "visibility": "" }, "pfa_pfa_2_header": { "text": "Contract Upholstery", "visibility": "" }, "pfa_pfa_2_copy": { "text": "Take your pick from our inspiring range of colors to create dynamic and comfortable spaces, with ease of cleaning, durability, quality and design.", "visibility": "" }, "pfa_pfa_2_cta": { "text": "View More", "visibility": "" }, "pfa_pfa_2_region": { "text": " USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribean", "visibility": "" }, "pfa_pfa_3_section_name": { "text": "COLLECTION", "visibility": "" }, "pfa_pfa_3_image_insert_image_or_reference_": { "text": "Residential & General Upholstery (Sofa uphostery, home environment)", "visibility": "" }, "pfa_pfa_3_header": { "text": "Residential & General Upholstery", "visibility": "" }, "pfa_pfa_3_copy": { "text": "We are a top supplier for local and international clients seeking best-in-class solutions in a wide variety of finishes and colors, meeting strict quality, durability and cleaning standards for interior upholstery.", "visibility": "" }, "pfa_pfa_3_cta": { "text": "View More", "visibility": "" }, "pfa_pfa_3_region": { "text": " LATAM South America and Central América , México , Caribe ", "visibility": "" }, "pfa_pfa_4_section_name": { "text": "COLLECTION", "visibility": "" }, "pfa_pfa_4_image_insert_image_or_reference_": { "text": "Marine & Outdoor Image (Yatch uphostery)", "visibility": "" }, "pfa_pfa_4_header": { "text": "Marine & Outdoor", "visibility": "" }, "pfa_pfa_4_copy": { "text": "Pleasantly soft and sophisticated products resistant to UV rays and salt water, assuring performance and durability in all types of outdoor installations.", "visibility": "" }, "pfa_pfa_4_cta": { "text": "View More", "visibility": "" }, "pfa_pfa_4_region": { "text": "Europe, North Africa, Middle East, Russia, UK", "visibility": "" }, "pfa_pfa_5_section_name": { "text": "COLLECTION", "visibility": "" }, "pfa_pfa_5_image_insert_image_or_reference_": { "text": "Footwear (Sport footwear Image)", "visibility": "" }, "pfa_pfa_5_header": { "text": "Footwear ", "visibility": "" }, "pfa_pfa_5_copy": { "text": "We walk with you every step of the way with high flexural strength footwear selections.", "visibility": "" }, "pfa_pfa_5_cta": { "text": "View More", "visibility": "" }, "pfa_pfa_5_region": { "text": " LATAM South America and Central América , México , Caribe ", "visibility": "" }, "pfa_pfa_6_section_name": { "text": "COLLECTION", "visibility": "" }, "pfa_pfa_6_image_insert_image_or_reference_": { "text": "Leather Goods  & SportBalls (Handbag or purse Image)", "visibility": "" }, "pfa_pfa_6_header": { "text": "Leather Goods  & SportBalls", "visibility": "" }, "pfa_pfa_6_copy": { "text": "High-performance collections engineered to last and withstand the most demading applications.", "visibility": "" }, "pfa_pfa_6_cta": { "text": "View More", "visibility": "" }, "pfa_pfa_6_region": { "text": " LATAM South America and Central América , México , Caribe ", "visibility": "" }, "pfa_pfa_7_section_name": { "text": "COLLECTION", "visibility": "" }, "pfa_pfa_7_image_insert_image_or_reference_": { "text": "Industrial ( Event Tent- Hangar)", "visibility": "" }, "pfa_pfa_7_header": { "text": "Safety Clothing and Linings & Tarpaulins", "visibility": "" }, "pfa_pfa_7_copy": { "text": "Expertly crafted to adapt to challenging environmental conditions and structural requirements.", "visibility": "" }, "pfa_pfa_7_cta": { "text": "View More", "visibility": "" }, "pfa_pfa_7_region": { "text": " LATAM South America and Central América , México , Caribe ", "visibility": "" }, "footer_headquarters": { "text": "Headquarters\nCL 61 Sur N. 43 A – 290\nSabaneta, Antioquia 055450\nColombia", "visibility": "" }, "footer_contact": { "text": "(create link to contact section)", "visibility": "" }, "footer_links": { "text": "Home", "visibility": "" }, "footer_social_media_channels": { "text": "Facebook", "visibility": "" }, "footer_cta": { "text": "", "visibility": "" }, "footer_region": { "text": "", "visibility": "" }, "footer_headquarters_11": { "text": "", "visibility": "" }, "footer_contact_11": { "text": "", "visibility": "" }, "footer_links_11": { "text": "About", "visibility": "" }, "footer_social_media_channels_11": { "text": "Twitter", "visibility": "" }, "footer_cta_11": { "text": "", "visibility": "" }, "footer_region_11": { "text": "", "visibility": "" }, "footer_headquarters_12": { "text": "", "visibility": "" }, "footer_contact_12": { "text": "", "visibility": "" }, "footer_links_12": { "text": "Collections", "visibility": "" }, "footer_social_media_channels_12": { "text": "Instagram", "visibility": "" }, "footer_cta_12": { "text": "", "visibility": "" }, "footer_region_12": { "text": "", "visibility": "" }, "footer_headquarters_13": { "text": "", "visibility": "" }, "footer_contact_13": { "text": "", "visibility": "" }, "footer_links_13": { "text": "Resources", "visibility": "" }, "footer_social_media_channels_13": { "text": "Linkedin", "visibility": "" }, "footer_cta_13": { "text": "", "visibility": "" }, "footer_region_13": { "text": "", "visibility": "" }, "footer_headquarters_14": { "text": "", "visibility": "" }, "footer_contact_14": { "text": "", "visibility": "" }, "footer_links_14": { "text": "Terms & Conditions ", "visibility": "" }, "footer_social_media_channels_14": { "text": "YouTube", "visibility": "" }, "footer_cta_14": { "text": "", "visibility": "" }, "footer_region_14": { "text": "", "visibility": "" }, "footer_headquarters_15": { "text": "", "visibility": "" }, "footer_contact_15": { "text": "", "visibility": "" }, "footer_links_15": { "text": "Privacy Policy", "visibility": "" }, "footer_social_media_channels_15": { "text": "social@nuvantglobal.com", "visibility": "" }, "footer_cta_15": { "text": "", "visibility": "" }, "footer_region_15": { "text": "", "visibility": "" } }, "es": { "pfa_pfa_1_section_name": { "text": "COLECCIÓN", "visibility": "" }, "pfa_pfa_1_image_insert_image_or_reference_": { "text": "Automotive interior upholstery high quality Image", "visibility": "" }, "pfa_pfa_1_header": { "text": "Automotriz", "visibility": "" }, "pfa_pfa_1_copy": { "text": "Presentamos nuestro portafolio de productos de la industria Automotriz con las más altas especificaciones técnicas.", "visibility": "" }, "pfa_pfa_1_cta": { "text": "Ver más", "visibility": "" }, "pfa_pfa_1_region": { "text": " USA & Canada,  LATAM South America and Central América , México , Caribean\n", "visibility": "" }, "pfa_pfa_1_": { "text": "", "visibility": "USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries); LATAM South America and Central América , México , Caribean\t" }, "pfa_pfa_1__1": { "text": "", "visibility": "USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries); LATAM South America and Central América , México , Caribean\t" }, "pfa_pfa_2_section_name": { "text": "COLECCIÓN", "visibility": "" }, "pfa_pfa_2_image_insert_image_or_reference_": { "text": "Contract Upholstery: Hospitality lobby focused on uphostery", "visibility": "" }, "pfa_pfa_2_header": { "text": "Tapicería Contract e Institucional", "visibility": "" }, "pfa_pfa_2_copy": { "text": "Descubra en nuestro portafolio una línea de productos que cumple con las más altas especificaciones de calidad, excelente gama de colores, limpieza y excelente durabilidad.", "visibility": "" }, "pfa_pfa_2_cta": { "text": "Ver más", "visibility": "" }, "pfa_pfa_2_region": { "text": " USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribean\n", "visibility": "" }, "pfa_pfa_2_": { "text": "", "visibility": "USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries); LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_2__2": { "text": "", "visibility": "USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries); LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_3_section_name": { "text": "COLECCIÓN", "visibility": "" }, "pfa_pfa_3_image_insert_image_or_reference_": { "text": "Residential & General Upholstery (Sofa uphostery, home environment)", "visibility": "" }, "pfa_pfa_3_header": { "text": "Tapicería Hogar", "visibility": "" }, "pfa_pfa_3_copy": { "text": "Ofrecemos productos de alto desempeño en una gran variedad de acabados y colores, cumpliendo con los estrictos estándares de calidad, durabilidad y limpieza para tapicería residencial.", "visibility": "" }, "pfa_pfa_3_cta": { "text": "Ver más", "visibility": "" }, "pfa_pfa_3_region": { "text": " LATAM South America and Central América , México , Caribe\n", "visibility": "" }, "pfa_pfa_3_": { "text": "", "visibility": "LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_3__3": { "text": "", "visibility": "LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_4_section_name": { "text": "COLECCIÓN", "visibility": "" }, "pfa_pfa_4_image_insert_image_or_reference_": { "text": "Marine & Outdoor Image (Yatch uphostery)", "visibility": "" }, "pfa_pfa_4_header": { "text": "Tapicería Náutica y Exteriores", "visibility": "" }, "pfa_pfa_4_copy": { "text": "Diseñamos productos suaves y sofisticados con altas especificaciónes técnicas de resistencia y durabilidad para todo tipo de instalaciones exteriores.", "visibility": "" }, "pfa_pfa_4_cta": { "text": "Ver más", "visibility": "" }, "pfa_pfa_4_region": { "text": "Europe, North Africa, Middle East, Russia, UK\nEuropa, norte de África, Medio Oriente, Rusia, Reino Unido\n\n", "visibility": "" }, "pfa_pfa_4_": { "text": "", "visibility": "\n\nUSA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries); LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_4__4": { "text": "", "visibility": "\n\nUSA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries); LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_5_section_name": { "text": "COLECCIÓN", "visibility": "" }, "pfa_pfa_5_image_insert_image_or_reference_": { "text": "Footwear (Sport footwear Image)", "visibility": "" }, "pfa_pfa_5_header": { "text": "Calzado", "visibility": "" }, "pfa_pfa_5_copy": { "text": "Producimos materiales de alta calidad y resistencia a la flexión para la fabricación de calzado casual y deportivo.", "visibility": "" }, "pfa_pfa_5_cta": { "text": "Ver más", "visibility": "" }, "pfa_pfa_5_region": { "text": " LATAM South America and Central América , México , Caribe \n", "visibility": "" }, "pfa_pfa_5_": { "text": "", "visibility": "LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_5__5": { "text": "", "visibility": "LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_6_section_name": { "text": "COLECCIÓN", "visibility": "" }, "pfa_pfa_6_image_insert_image_or_reference_": { "text": "Leather Goods  & SportBalls (Handbag or purse Image)", "visibility": "" }, "pfa_pfa_6_header": { "text": "Marroquinería y Balones", "visibility": "" }, "pfa_pfa_6_copy": { "text": "Elaboramos un portafolio diverso de colecciones que se adaptan a sus necesidades, diseñados con los más altos estándares de calidad.", "visibility": "" }, "pfa_pfa_6_cta": { "text": "Ver más", "visibility": "" }, "pfa_pfa_6_region": { "text": " LATAM South America and Central América , México , Caribe\n", "visibility": "" }, "pfa_pfa_6_": { "text": "", "visibility": "LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_6__6": { "text": "", "visibility": "LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_7_section_name": { "text": "COLECCIÓN\n", "visibility": "" }, "pfa_pfa_7_image_insert_image_or_reference_": { "text": "Industrial ( Event Tent- Hangar)", "visibility": "" }, "pfa_pfa_7_header": { "text": "Industrial", "visibility": "" }, "pfa_pfa_7_copy": { "text": "Atendemos la demanda de una amplia gama de materiales ligeros y pesados, con excelentes propiedades mecánicas de alta calidad, que se adaptan a las desafiantes condiciones ambientales y requisitos estructurales.", "visibility": "" }, "pfa_pfa_7_cta": { "text": "Ver más", "visibility": "" }, "pfa_pfa_7_region": { "text": " LATAM South America and Central América , México , Caribe\n", "visibility": "" }, "pfa_pfa_7_": { "text": "", "visibility": "LATAM South America and Central América , México , Caribean        " }, "pfa_pfa_7__7": { "text": "", "visibility": "LATAM South America and Central América , México , Caribean        " }, "footer_headquarters": { "text": "Oficina principal\nCL 61 Sur N. 43 A – 290\nSabaneta, Antioquia 055450\nColombia\nOficinas centrales", "visibility": "" }, "footer_contact": { "text": "(create link to contact section)", "visibility": "" }, "footer_link": { "text": "\nInicio", "visibility": "" }, "footer_social_media_channels": { "text": "Facebook", "visibility": "" }, "footer_cta": { "text": "", "visibility": "" }, "footer_region": { "text": "", "visibility": "" }, "footer_": { "text": "", "visibility": "" }, "footer__10": { "text": "", "visibility": "" }, "footer_headquarters_11": { "text": "", "visibility": "" }, "footer_contact_11": { "text": "", "visibility": "" }, "footer_link_11": { "text": "\nQuiénes Somos", "visibility": "" }, "footer_social_media_channels_11": { "text": "Twitter", "visibility": "" }, "footer_cta_11": { "text": "", "visibility": "" }, "footer_region_11": { "text": "", "visibility": "" }, "footer__11": { "text": "", "visibility": "" }, "footer_headquarters_12": { "text": "", "visibility": "" }, "footer_contact_12": { "text": "", "visibility": "" }, "footer_link_12": { "text": "\nColecciones", "visibility": "" }, "footer_social_media_channels_12": { "text": "Instagram", "visibility": "" }, "footer_cta_12": { "text": "", "visibility": "" }, "footer_region_12": { "text": "", "visibility": "" }, "footer__12": { "text": "", "visibility": "" }, "footer_headquarters_13": { "text": "", "visibility": "" }, "footer_contact_13": { "text": "", "visibility": "" }, "footer_link_13": { "text": "\nRecursos", "visibility": "" }, "footer_social_media_channels_13": { "text": "Linkedin", "visibility": "" }, "footer_cta_13": { "text": "", "visibility": "" }, "footer_region_13": { "text": "", "visibility": "" }, "footer__13": { "text": "", "visibility": "" }, "footer_headquarters_14": { "text": "", "visibility": "" }, "footer_contact_14": { "text": "", "visibility": "" }, "footer_link_14": { "text": "\nPolítica de Tratamiento de Datos", "visibility": "" }, "footer_social_media_channels_14": { "text": "YouTube", "visibility": "" }, "footer_cta_14": { "text": "", "visibility": "" }, "footer_region_14": { "text": "", "visibility": "" }, "footer__14": { "text": "", "visibility": "" }, "footer_headquarters_15": { "text": "", "visibility": "" }, "footer_contact_15": { "text": "", "visibility": "" }, "footer_link_15": { "text": "", "visibility": "" }, "footer_social_media_channels_15": { "text": "social@nuvantglobal.com", "visibility": "" }, "footer_cta_15": { "text": "", "visibility": "" }, "footer_region_15": { "text": "", "visibility": "" }, "footer__15": { "text": "", "visibility": "" }, "footer_headquarters_22": { "text": "", "visibility": "" }, "footer_contact_22": { "text": "", "visibility": "" }, "footer_link_22": { "text": "", "visibility": "" }, "footer_social_media_channels_22": { "text": "", "visibility": "" }, "footer_cta_22": { "text": "", "visibility": "" }, "footer_region_22": { "text": "", "visibility": "" }, "footer__22": { "text": "Y", "visibility": "" }, "footer_headquarters_23": { "text": "", "visibility": "" }, "footer_contact_23": { "text": "", "visibility": "" }, "footer_link_23": { "text": "", "visibility": "" }, "footer_social_media_channels_23": { "text": "", "visibility": "" }, "footer_cta_23": { "text": "", "visibility": "" }, "footer_region_23": { "text": "", "visibility": "" }, "footer__23": { "text": "Y", "visibility": "" }, "footer_headquarters_24": { "text": "", "visibility": "" }, "footer_contact_24": { "text": "", "visibility": "" }, "footer_link_24": { "text": "", "visibility": "" }, "footer_social_media_channels_24": { "text": "", "visibility": "" }, "footer_cta_24": { "text": "", "visibility": "" }, "footer_region_24": { "text": "", "visibility": "" }, "footer__24": { "text": "Y", "visibility": "" }, "footer_headquarters_25": { "text": "", "visibility": "" }, "footer_contact_25": { "text": "", "visibility": "" }, "footer_link_25": { "text": "", "visibility": "" }, "footer_social_media_channels_25": { "text": "", "visibility": "" }, "footer_cta_25": { "text": "", "visibility": "" }, "footer_region_25": { "text": "", "visibility": "" }, "footer__25": { "text": "N", "visibility": "" }, "footer_headquarters_26": { "text": "", "visibility": "" }, "footer_contact_26": { "text": "", "visibility": "" }, "footer_link_26": { "text": "", "visibility": "" }, "footer_social_media_channels_26": { "text": "", "visibility": "" }, "footer_cta_26": { "text": "", "visibility": "" }, "footer_region_26": { "text": "", "visibility": "" }, "footer__26": { "text": "N", "visibility": "" }, "footer_headquarters_27": { "text": "", "visibility": "" }, "footer_contact_27": { "text": "", "visibility": "" }, "footer_link_27": { "text": "", "visibility": "" }, "footer_social_media_channels_27": { "text": "", "visibility": "" }, "footer_cta_27": { "text": "", "visibility": "" }, "footer_region_27": { "text": "", "visibility": "" }, "footer__27": { "text": "N", "visibility": "" }, "footer_headquarters_28": { "text": "", "visibility": "" }, "footer_contact_28": { "text": "", "visibility": "" }, "footer_link_28": { "text": "", "visibility": "" }, "footer_social_media_channels_28": { "text": "", "visibility": "" }, "footer_cta_28": { "text": "", "visibility": "" }, "footer_region_28": { "text": "", "visibility": "" }, "footer__28": { "text": "N", "visibility": "" }, "footer_headquarters_29": { "text": "", "visibility": "" }, "footer_contact_29": { "text": "", "visibility": "" }, "footer_link_29": { "text": "", "visibility": "" }, "footer_social_media_channels_29": { "text": "", "visibility": "" }, "footer_cta_29": { "text": "", "visibility": "" }, "footer_region_29": { "text": "", "visibility": "" }, "footer__29": { "text": "N", "visibility": "" } } }
    }, {}], 9: [function (require, module, exports) {
        module.exports = {
            "en": {
                "contact_headquarters": {
                    "text": "Headquarters Office:\nCL 61 Sur N. 43 A – 290\r\nSabaneta, Antioquia 055450\r\nColombia\n\nBogota Office:\nCL 18 N. 69 B – 35\nBogotá, Colombia\n",
                    "visibility": "LATAM South America and Central América , México , Caribean"
                },
                "contact_phone_number": {
                    "text": "Colombia Toll Free Customer Service:\n 018000510755\n\nPBX:\n+574 3788686\n\nBogotá Office:\n+571 6449876",
                    "visibility": "LATAM South America and Central América , México , Caribean"
                },
                "contact_email": {
                    "text": "sales@nuvantglobal.com",
                    "visibility": "LATAM South America and Central América , México , Caribean"
                },
                "contact_": {
                    "text": "",
                    "visibility": "LATAM South America and Central América , México , Caribean"
                },
                "contact__1": {
                    "text": "",
                    "visibility": "LATAM South America and Central América , México , Caribean"
                },
                "contact_headquarters_2": {
                    "text": "2261 NW 66th Av. Building 702, Suite 221\nMiami, FL 33152 \n",
                    "visibility": "USA & Canada"
                },
                "contact_phone_number_2": {
                    "text": "Contract Division:  +1-336-909-8437\nAutomotive Division:  +1-248-761-2097",
                    "visibility": "USA & Canada"
                },
                "contact_email_2": {
                    "text": "northamerica@nuvantglobal.com",
                    "visibility": "USA & Canada"
                },
                "contact__2": {
                    "text": "",
                    "visibility": "USA & Canada"
                },
                "contact_headquarters_3": {
                    "text": "\nSpain Office: \nOsona, 2 (Edificio REGUS Mas Blau)\n08820 El Prat de Llobregat (Barcelona)\n\nGermany office:\nBei der Lehmkuhle 3 / Halle B2\n21629 Neu Wulmstorf\nGermay\n",
                    "visibility": "Europe, North Africa, Middle East, Russia, UK"
                },
                "contact_phone_number_3": {
                    "text": "Spain : +34 93 192 14 15\n\nGermany: \n+49 (0) 6142 - 2104595\n+49 (0) 6142 - 2104597\n+49 (0) 6142 - 2104596\n",
                    "visibility": "Europe, North Africa, Middle East, Russia, UK"
                },
                "contact_email_3": {
                    "text": "spain@nuvantglobal.com\n\ngermany@nuvantglobal.com",
                    "visibility": "Europe, North Africa, Middle East, Russia, UK"
                },
                "contact__3": {
                    "text": "",
                    "visibility": "Europe, North Africa, Middle East, Russia, UK"
                },
                "contact_headquarters_4": {
                    "text": "(all addresses above)",
                    "visibility": "Global / General (Asia, Australia , other countries)"
                },
                "contact_phone_number_4": {
                    "text": "(show all phone numbers above, with location)",
                    "visibility": "Global / General (Asia, Australia , other countries)"
                },
                "contact_email_4": {
                    "text": "(show all e-mails above, with location)",
                    "visibility": "Global / General (Asia, Australia , other countries)"
                },
                "contact__4": {
                    "text": "",
                    "visibility": "Global / General (Asia, Australia , other countries)"
                },
                "contact_form_input_name": {
                    "text": "#1 - Your Name",
                    "visibility": ""
                },
                "contact_form_section_name": {
                    "text": "CONTACT",
                    "visibility": ""
                },
                "contact_form_image": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header": {
                    "text": "Contact Us",
                    "visibility": ""
                },
                "contact_form_subheader": {
                    "text": "We’d love to hear from you. Please drop us a line and we’ll respond as soon as possible.",
                    "visibility": ""
                },
                "contact_form_copy": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields": {
                    "text": "Your Name",
                    "visibility": ""
                },
                "contact_form_cta": {
                    "text": "Submit",
                    "visibility": ""
                },
                "contact_form_input_name_8": {
                    "text": "#2 - Phone Number",
                    "visibility": ""
                },
                "contact_form_section_name_8": {
                    "text": "Get In Touch",
                    "visibility": ""
                },
                "contact_form_image_8": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header_8": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_8": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_8": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_8": {
                    "text": "Phone Number",
                    "visibility": ""
                },
                "contact_form_cta_8": {
                    "text": "Submit",
                    "visibility": ""
                },
                "contact_form_input_name_9": {
                    "text": "#3 - Your Email",
                    "visibility": ""
                },
                "contact_form_section_name_9": {
                    "text": "Get In Touch",
                    "visibility": ""
                },
                "contact_form_image_9": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header_9": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_9": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_9": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_9": {
                    "text": "Your Email",
                    "visibility": ""
                },
                "contact_form_cta_9": {
                    "text": "Submit",
                    "visibility": ""
                },
                "contact_form_input_name_10": {
                    "text": "#4 - Subject",
                    "visibility": ""
                },
                "contact_form_section_name_10": {
                    "text": "Get In Touch",
                    "visibility": ""
                },
                "contact_form_image_10": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header_10": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_10": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_10": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_10": {
                    "text": "Subject",
                    "visibility": ""
                },
                "contact_form_cta_10": {
                    "text": "Submit",
                    "visibility": ""
                },
                "contact_form_input_name_11": {
                    "text": "#5 - Your message",
                    "visibility": ""
                },
                "contact_form_section_name_11": {
                    "text": "Get In Touch",
                    "visibility": ""
                },
                "contact_form_image_11": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header_11": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_11": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_11": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_11": {
                    "text": "Your message",
                    "visibility": ""
                },
                "contact_form_cta_11": {
                    "text": "Submit",
                    "visibility": ""
                },
                "contact_form_input_name_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_section_name_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_image_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_header_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_cta_12": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters": {
                    "text": "Headquarters\nCL 61 Sur N. 43 A – 290\nSabaneta, Antioquia 055450\nColombia",
                    "visibility": ""
                },
                "footer_contact": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links": {
                    "text": "Home",
                    "visibility": ""
                },
                "footer_social_media_channels": {
                    "text": "Facebook",
                    "visibility": ""
                },
                "footer_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_16": {
                    "text": "About",
                    "visibility": ""
                },
                "footer_social_media_channels_16": {
                    "text": "Twitter",
                    "visibility": ""
                },
                "footer_subheader_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_17": {
                    "text": "Collections",
                    "visibility": ""
                },
                "footer_social_media_channels_17": {
                    "text": "Instagram",
                    "visibility": ""
                },
                "footer_subheader_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_18": {
                    "text": "Resources",
                    "visibility": ""
                },
                "footer_social_media_channels_18": {
                    "text": "Linkedin",
                    "visibility": ""
                },
                "footer_subheader_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_19": {
                    "text": "Terms & Conditions ",
                    "visibility": ""
                },
                "footer_social_media_channels_19": {
                    "text": "YouTube",
                    "visibility": ""
                },
                "footer_subheader_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_20": {
                    "text": "Privacy Policy",
                    "visibility": ""
                },
                "footer_social_media_channels_20": {
                    "text": "social@nuvantglobal.com",
                    "visibility": ""
                },
                "footer_subheader_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_20": {
                    "text": "",
                    "visibility": ""
                }
            },
            "es": {
                "contact_headquarters": {
                    "text": "Oficina principal:\nCL 61 Sur N. 43 A – 290\nSabaneta, Antioquía 055450\nColombia\n\nOficina de Bogotá:\nCL 18 N. 69 B – 35\nBogotá, Colombia\n",
                    "visibility": "América del Sur y América Central, México, Caribe"
                },
                "contact_sales": {
                    "text": "Línea gratuita\nde servicio al cliente desde Colombia:\n 018000510755\n\nFAX:\n+574 3788686\n\nOficina de Bogotá:\n+571 6449876",
                    "visibility": "América del Sur y América Central, México, Caribe"
                },
                "contact_email": {
                    "text": "sales@nuvantglobal.com",
                    "visibility": "América del Sur y América Central, México, Caribe"
                },
                "contact_": {
                    "text": "",
                    "visibility": "América del Sur y América Central, México, Caribe"
                },
                "contact__1": {
                    "text": "",
                    "visibility": "América del Sur y América Central, México, Caribe"
                },
                "contact_headquarters_2": {
                    "text": "2261 NW 66th Av. Building 702, Suite 221\nMiami, FL 33152 \n",
                    "visibility": "EE. UU. y Canadá"
                },
                "contact_sales_2": {
                    "text": "Línea de Contract:  +1-336-909-8437\nLínea Automotriz:  +1-248-761-2097",
                    "visibility": "EE. UU. y Canadá"
                },
                "contact_email_2": {
                    "text": "northamerica@nuvantglobal.com",
                    "visibility": "EE. UU. y Canadá"
                },
                "contact__2": {
                    "text": "",
                    "visibility": "EE. UU. y Canadá"
                },
                "contact_headquarters_3": {
                    "text": "\nOficina de España: \nOsona, 2 (Edificio REGUS Mas Blau)\n08820 El Prat de Llobregat (Barcelona)\n\nOficina de Alemania:\nBei der Lehmkuhle 3 / Halle B2\n21629 Neu Wulmstorf\nGermay\n",
                    "visibility": "Europa, África del Norte, Medio Oriente, Rusia, Reino Unido"
                },
                "contact_sales_3": {
                    "text": "España : +34 93 192 14 15\n\nAlemania: \n+49 (0) 6142 - 2104595\n+49 (0) 6142 - 2104597\n+49 (0) 6142 - 2104596\n",
                    "visibility": "Europa, África del Norte, Medio Oriente, Rusia, Reino Unido"
                },
                "contact_email_3": {
                    "text": "spain@nuvantglobal.com\n\ngermany@nuvantglobal.com",
                    "visibility": "Europa, África del Norte, Medio Oriente, Rusia, Reino Unido"
                },
                "contact__3": {
                    "text": "",
                    "visibility": "Europa, África del Norte, Medio Oriente, Rusia, Reino Unido"
                },
                "contact_headquarters_4": {
                    "text": "(mostrar todos los correos electrónicos de arriba con las locaciones)",
                    "visibility": "Global / General (Asia, Australia, otros países)"
                },
                "contact_sales_4": {
                    "text": "(mostrar todos los correos electrónicos de arriba con las locaciones)",
                    "visibility": "Global / General (Asia, Australia, otros países)"
                },
                "contact_email_4": {
                    "text": "(mostrar todos los correos electrónicos de arriba con las locaciones)",
                    "visibility": "Global / General (Asia, Australia, otros países)"
                },
                "contact__4": {
                    "text": "",
                    "visibility": "Global / General (Asia, Australia, otros países)"
                },
                "contact_form_input_name": {
                    "text": "#1 - Nombre",
                    "visibility": ""
                },
                "contact_form_section_name": {
                    "text": "Contáctenos",
                    "visibility": ""
                },
                "contact_form_image": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header": {
                    "text": "Contáctenos",
                    "visibility": ""
                },
                "contact_form_subheader": {
                    "text": "Queremos escuchar sus opiniones. Contáctenos y responderemos tan pronto como sea posible.",
                    "visibility": ""
                },
                "contact_form_copy": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields": {
                    "text": "Nombre",
                    "visibility": ""
                },
                "contact_form_cta": {
                    "text": "Enviar",
                    "visibility": ""
                },
                "contact_form_input_name_8": {
                    "text": "#2 - Número de teléfono",
                    "visibility": ""
                },
                "contact_form_section_name_8": {
                    "text": "Contáctenos",
                    "visibility": ""
                },
                "contact_form_image_8": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header_8": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_8": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_8": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_8": {
                    "text": "Teléfono",
                    "visibility": ""
                },
                "contact_form_cta_8": {
                    "text": "Enviar",
                    "visibility": ""
                },
                "contact_form_input_name_9": {
                    "text": "#3 - Correo electrónico",
                    "visibility": ""
                },
                "contact_form_section_name_9": {
                    "text": "Contáctenos",
                    "visibility": ""
                },
                "contact_form_image_9": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header_9": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_9": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_9": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_9": {
                    "text": "Correo electrónico",
                    "visibility": ""
                },
                "contact_form_cta_9": {
                    "text": "Enviar",
                    "visibility": ""
                },
                "contact_form_input_name_10": {
                    "text": "#4 - Asunto",
                    "visibility": ""
                },
                "contact_form_section_name_10": {
                    "text": "Contáctenos",
                    "visibility": ""
                },
                "contact_form_image_10": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header_10": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_10": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_10": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_10": {
                    "text": "Asunto",
                    "visibility": ""
                },
                "contact_form_cta_10": {
                    "text": "Enviar",
                    "visibility": ""
                },
                "contact_form_input_name_11": {
                    "text": "#5 - Mensaje",
                    "visibility": ""
                },
                "contact_form_section_name_11": {
                    "text": "Contáctenos",
                    "visibility": ""
                },
                "contact_form_image_11": {
                    "text": "-",
                    "visibility": ""
                },
                "contact_form_header_11": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_11": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_11": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_11": {
                    "text": "Mensaje",
                    "visibility": ""
                },
                "contact_form_cta_11": {
                    "text": "Enviar",
                    "visibility": ""
                },
                "contact_form_input_name_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_section_name_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_image_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_header_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_subheader_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_copy_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_interactive_fields_12": {
                    "text": "",
                    "visibility": ""
                },
                "contact_form_cta_12": {
                    "text": "Y",
                    "visibility": ""
                },
                "footer_headquarters": {
                    "text": "Oficina principal\nCL 61 Sur N. 43 A – 290\nSabaneta, Antioquia 055450\nColombia\n",
                    "visibility": ""
                },
                "footer_contact": {
                    "text": "(create link to contact section)",
                    "visibility": ""
                },
                "footer_links": {
                    "text": "\nInicio",
                    "visibility": ""
                },
                "footer_social_media_channels": {
                    "text": "Facebook",
                    "visibility": ""
                },
                "footer_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_16": {
                    "text": "\nQuiénes Somos",
                    "visibility": ""
                },
                "footer_social_media_channels_16": {
                    "text": "Twitter",
                    "visibility": ""
                },
                "footer_subheader_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_16": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_17": {
                    "text": "\nColecciones",
                    "visibility": ""
                },
                "footer_social_media_channels_17": {
                    "text": "Instagram",
                    "visibility": ""
                },
                "footer_subheader_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_17": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_18": {
                    "text": "\nRecursos",
                    "visibility": ""
                },
                "footer_social_media_channels_18": {
                    "text": "Linkedin",
                    "visibility": ""
                },
                "footer_subheader_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_18": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_19": {
                    "text": "\nPolítica de Tratamiento de Datos",
                    "visibility": ""
                },
                "footer_social_media_channels_19": {
                    "text": "YouTube",
                    "visibility": ""
                },
                "footer_subheader_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_19": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_social_media_channels_20": {
                    "text": "social@nuvantglobal.com",
                    "visibility": ""
                },
                "footer_subheader_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_copy_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_interactive_fields_20": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_20": {
                    "text": "",
                    "visibility": ""
                }
            }
        }
    }, {}], 10: [function (require, module, exports) {
        module.exports = {
            "en": {
                "LATAM": {
                    "offices": [
                        {
                            "name": "Headquarters Office",
                            "address": [
                                "CL 61 Sur N. 43 A – 290",
                                "Sabaneta, Antioquia 055450",
                                "Colombia"
                            ]
                        },
                        {
                            "name": "Bogota Office",
                            "address": [
                                "CL 18 N. 69 B – 35",
                                "Bogotá, Colombia"
                            ]
                        }
                    ],
                    "numbers": {
                        "Headquarters": [
                            "+574 3788686 Ext.15470"
                        ],
                        "Bogotá Office": [
                            "+571 6449876 Ext.19470"
                        ]
                    },
                    "emails": [
                        "latam@nuvantglobal.com"
                    ]
                },
                "USA & Canada": {
                    "offices": [
                        {
                            "name": "US & Canada",
                            "address": [
                                "2261 NW 66th Av. Building 702, Suite 221",
                                "Miami, FL, 33152"
                            ]
                        }
                    ],
                    "numbers": {
                        "Contract Division": ["+1-336-909-8437"],
                        "Automotive Division": ["+1-248-761-2097"]
                    },
                    "emails": [
                        "northamerica@nuvantglobal.com"
                    ]
                },
                "Europe": {
                    "offices": [
                        {
                            "name": "Spain Office",
                            "address": [
                                "Osona, 2 (Edificio REGUS Mas Blau)",
                                "08820 El Prat de Llobregat (Barcelona)"
                            ]
                        },
                        {
                            "name": "Germany office",
                            "address": [
                                "Neuer Wall 10",
                                "20354 Hamburg",
                                "Germany"
                            ]
                        }
                    ],
                    "numbers": {
                        "Spain": [
                            "+34 93 192 14 15"
                        ],
                        "Germany": [
                            "+49 (0) 6142 - 2104595",
                            " +49 (0) 6142 - 2104597",
                            " +49 (0) 6142 - 2104596"
                        ]
                    },
                    "emails": [
                        "spain@nuvantglobal.com",
                        "germany@nuvantglobal.com"
                    ]
                }
            },

            "es": {
                "LATAM": {
                    "offices": [
                        {
                            "name": "Oficina de la Sede",
                            "address": [
                                "CL 61 Sur N. 43 A – 290",
                                "Sabaneta, Antioquia 055450",
                                "Colombia"
                            ]
                        },
                        {
                            "name": "Oficina de Bogotá",
                            "address": [
                                "CL 18 N. 69 B – 35",
                                "Bogotá, Colombia"
                            ]
                        }
                    ],
                    "numbers": {
                        "Colombia Toll Free Customer Service": [
                            "018000510755"
                        ],
                        "PBX": [
                            "+574 3788686"
                        ],
                        "Bogotá": [
                            "+571 6449876"
                        ]
                    },
                    "emails": [
                        "sales@nuvantglobal.com"
                    ]
                },
                "USA & Canada": {
                    "offices": [
                        {
                            "name": "USA de la Sede",
                            "address": [
                                "2261 NW 66th Av. Building 702, Suite 221",
                                "Miami, FL, 33152"
                            ]
                        }
                    ],
                    "numbers": {
                        "Contract Division": ["+1-336-909-8437"],
                        "Automotive Division": ["+1-248-761-2097"]
                    },
                    "emails": [
                        "northamerica@nuvantglobal.com"
                    ]
                },
                "Europe": {
                    "offices": [
                        {
                            "name": "Spain Office",
                            "address": [
                                "Osona, 2 (Edificio REGUS Mas Blau)",
                                "08820 El Prat de Llobregat (Barcelona)"
                            ]
                        },
                        {
                            "name": "Germany office",
                            "address": [
                                "Bei der Lehmkuhle 3 / Halle B2",
                                "21629 Neu Wulmstorf",
                                "Germany"
                            ]
                        }
                    ],
                    "numbers": {
                        "Spain": [
                            "+34 93 192 14 15"
                        ],
                        "Germany": [
                            "+49 (0) 6142 - 2104595",
                            "+49 (0) 6142 - 2104597",
                            "+49 (0) 6142 - 2104596"
                        ]
                    },
                    "emails": [
                        "spain@nuvantglobal.com",
                        "germany@nuvantglobal.com"
                    ]
                }
            }
        }
    }, {}], 11: [function (require, module, exports) {
        module.exports = { "en": { "footer_headquarters": { "text": "Headquarters", "visibility": "" }, "footer_address": { "text": "CL 61 Sur N. 43 A – 290\nSabaneta, Antioquia 055450\nColombia", "visibility": "" }, "footer_contact": { "text": "(create link to contact section)", "visibility": "" }, "footer_links": { "text": "Home", "visibility": "" }, "footer_social_media_channels": { "text": "Facebook", "visibility": "" }, "footer_headquarters_2": { "text": "", "visibility": "" }, "footer_address_2": { "text": "", "visibility": "" }, "footer_contact_2": { "text": "", "visibility": "" }, "footer_links_2": { "text": "About", "visibility": "" }, "footer_social_media_channels_2": { "text": "Twitter", "visibility": "" }, "footer_headquarters_3": { "text": "", "visibility": "" }, "footer_address_3": { "text": "", "visibility": "" }, "footer_contact_3": { "text": "", "visibility": "" }, "footer_links_3": { "text": "Collections", "visibility": "" }, "footer_social_media_channels_3": { "text": "Instagram", "visibility": "" }, "footer_headquarters_4": { "text": "", "visibility": "" }, "footer_address_4": { "text": "", "visibility": "" }, "footer_contact_4": { "text": "", "visibility": "" }, "footer_links_4": { "text": "Resources", "visibility": "" }, "footer_social_media_channels_4": { "text": "Linkedin", "visibility": "" }, "footer_headquarters_5": { "text": "", "visibility": "" }, "footer_address_5": { "text": "", "visibility": "" }, "footer_contact_5": { "text": "", "visibility": "" }, "footer_links_5": { "text": "Terms & Conditions ", "visibility": "" }, "footer_social_media_channels_5": { "text": "YouTube", "visibility": "" }, "footer_headquarters_6": { "text": "", "visibility": "" }, "footer_address_6": { "text": "", "visibility": "" }, "footer_contact_6": { "text": "", "visibility": "" }, "footer_links_6": { "text": "Privacy Policy", "visibility": "" }, "footer_social_media_channels_6": { "text": "social@nuvantglobal.com", "visibility": "" } }, "es": { "footer_headquarters": { "text": "Oficina principal", "visibility": "" }, "footer_address": { "text": "\nCL 61 Sur N. 43 A – 290\nSabaneta, Antioquia 055450\nColombia\nOficinas centrales", "visibility": "" }, "footer_contact": { "text": "(create link to contact section)", "visibility": "" }, "footer_links": { "text": "\nInicio", "visibility": "" }, "footer_social_media_channels": { "text": "Facebook", "visibility": "" }, "footer_headquarters_2": { "text": "", "visibility": "" }, "footer_address_2": { "text": "", "visibility": "" }, "footer_contact_2": { "text": "", "visibility": "" }, "footer_links_2": { "text": "\nQuiénes Somos", "visibility": "" }, "footer_social_media_channels_2": { "text": "Twitter", "visibility": "" }, "footer_headquarters_3": { "text": "", "visibility": "" }, "footer_address_3": { "text": "", "visibility": "" }, "footer_contact_3": { "text": "", "visibility": "" }, "footer_links_3": { "text": "\nColecciones", "visibility": "" }, "footer_social_media_channels_3": { "text": "Instagram", "visibility": "" }, "footer_headquarters_4": { "text": "", "visibility": "" }, "footer_address_4": { "text": "", "visibility": "" }, "footer_contact_4": { "text": "", "visibility": "" }, "footer_links_4": { "text": "\nRecursos", "visibility": "" }, "footer_social_media_channels_4": { "text": "Linkedin", "visibility": "" }, "footer_headquarters_5": { "text": "", "visibility": "" }, "footer_address_5": { "text": "", "visibility": "" }, "footer_contact_5": { "text": "", "visibility": "" }, "footer_links_5": { "text": "\nPolítica de manejo de datos", "visibility": "" }, "footer_social_media_channels_5": { "text": "YouTube", "visibility": "" }, "footer_headquarters_6": { "text": "", "visibility": "" }, "footer_address_6": { "text": "", "visibility": "" }, "footer_contact_6": { "text": "", "visibility": "" }, "footer_links_6": { "text": "", "visibility": "" }, "footer_social_media_channels_6": { "text": "social@nuvantglobal.com", "visibility": "" } } }
    }, {}], 12: [function (require, module, exports) {
        module.exports = {
            "en": {
                "pfa_pfa_1_section_name": {
                    "text": "Dedicated To The Highest Quality of Material & Service",
                    "visibility": ""
                },
                "pfa_pfa_1_image": {
                    "text": "Interior automotive high quality upholstery furniture ",
                    "visibility": ""
                },
                "pfa_pfa_1_header": {
                    "text": "Modern, Sleek, Durable",
                    "visibility": ""
                },
                "pfa_pfa_1_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "pfa_pfa_1_body": {
                    "text": "We create and distribute top-quality automotive upholstery products, meeting strict specifications of the indutry in terms of quality, durability and safety.",
                    "visibility": ""
                },
                "pfa_pfa_1_cta": {
                    "text": "Learn More",
                    "visibility": ""
                },
                "pfa_pfa_1_default_region_language": {
                    "text": "SA & Canada - English\r\nLATAM South America and Central América, México, Caribbean - Spanish\r\nEurope - English. (Language option to change to German if in Germany and Spanish if in Spain.)\r\nNorth Africa - English\r\nMiddle East - English\r\nRussia - English\r\nUK - English\r\nGlobal / General (Asia, Australia , other countries) - English",
                    "visibility": " USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribean"
                },
                "pfa_pfa_2_section_name": {
                    "text": "Contract uphostery",
                    "visibility": ""
                },
                "pfa_pfa_2_image": {
                    "text": "Hospitality - Lobby upholstery furniture",
                    "visibility": ""
                },
                "pfa_pfa_2_header": {
                    "text": "Raising the bar",
                    "visibility": ""
                },
                "pfa_pfa_2_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "pfa_pfa_2_body": {
                    "text": "Beyond offering one the the biggest lineups of premium products, we set industry standards for the following sectors: corporate, education, hospitality and public spaces.",
                    "visibility": ""
                },
                "pfa_pfa_2_cta": {
                    "text": "Learn More",
                    "visibility": ""
                },
                "pfa_pfa_2_default_region_language": {
                    "text": "",
                    "visibility": " USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribean"
                },
                "pfa_pfa_3_section_name": {
                    "text": "Contract uphostery",
                    "visibility": ""
                },
                "pfa_pfa_3_image": {
                    "text": "Upholstered furniture (example Maharam)",
                    "visibility": ""
                },
                "pfa_pfa_3_header": {
                    "text": "Style and substance",
                    "visibility": ""
                },
                "pfa_pfa_3_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "pfa_pfa_3_body": {
                    "text": "We take pride in delivering attractive options for contract uphostery, enhanced over the years through strict quality standards.",
                    "visibility": ""
                },
                "pfa_pfa_3_cta": {
                    "text": "Learn More",
                    "visibility": ""
                },
                "pfa_pfa_3_default_region_language": {
                    "text": "",
                    "visibility": " USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribean"
                },
                "about_us_about_us_1_section_name": {
                    "text": "WHO WE ARE",
                    "visibility": ""
                },
                "about_us_about_us_1_image": {
                    "text": "Image #1 Company fotos",
                    "visibility": ""
                },
                "about_us_about_us_1_header": {
                    "text": "A global company dedicated to the design and manufacturing of coated textiles.",
                    "visibility": ""
                },
                "about_us_about_us_1_subheader": {
                    "text": "Your reliable partner dedicated to the highest quality of material and service.\r\n",
                    "visibility": ""
                },
                "about_us_about_us_1_body": {
                    "text": "Nuvant serves different markets worldwide and is constantly striving to develop new products and solutions. Our products are powerful and can be used for a wide range of applications, meeting the requirements of the respective markets.\r\nOur greatest strength is the relationship with our clients together with a team of highly trained people working towards excellence and the highest quality standards.",
                    "visibility": ""
                },
                "about_us_about_us_1_cta": {
                    "text": "",
                    "visibility": ""
                },
                "about_us_about_us_1_default_region_language": {
                    "text": "",
                    "visibility": " USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribean"
                },
                "sustainability_section_name": {
                    "text": "Sustainability ",
                    "visibility": ""
                },
                "sustainability_image": {
                    "text": "",
                    "visibility": ""
                },
                "sustainability_header": {
                    "text": "Growing sustainably",
                    "visibility": ""
                },
                "sustainability_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "sustainability_body": {
                    "text": "We’re committed to streamlining processes to reduce our carbon footprint throughout every step of the way.",
                    "visibility": ""
                },
                "sustainability_cta": {
                    "text": "",
                    "visibility": ""
                },
                "sustainability_default_region_language": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_section_name": {
                    "text": "Certifications",
                    "visibility": ""
                },
                "certifications_image": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_header": {
                    "text": "Certified Quality",
                    "visibility": ""
                },
                "certifications_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "certifications_body": {
                    "text": "Our processes related to production, management, and inspection have been certified by international organizations.",
                    "visibility": ""
                },
                "certifications_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_default_region_language": {
                    "text": "",
                    "visibility": ""
                },
                "collections_section_name": {
                    "text": "",
                    "visibility": ""
                },
                "collections_image": {
                    "text": "",
                    "visibility": ""
                },
                "collections_swatch": {
                    "text": "",
                    "visibility": ""
                },
                "collections_header": {
                    "text": "Versatile and eclectic collections",
                    "visibility": ""
                },
                "collections_cta": {
                    "text": "",
                    "visibility": ""
                },
                "collections_main_section_cta": {
                    "text": "",
                    "visibility": ""
                },
                "collections_default_region_language": {
                    "text": "",
                    "visibility": ""
                },
                "collections_collections_section_name": {
                    "text": "Automotive",
                    "visibility": ""
                },
                "collections_collections_image": {
                    "text": "Interior automotive high quality upholstery (Trim interior car)",
                    "visibility": ""
                },
                "collections_collections_swatch": {
                    "text": "",
                    "visibility": ""
                },
                "collections_collections_header": {
                    "text": "Versatile & Eclectic Collections",
                    "visibility": ""
                },
                "collections_collections_cta": {
                    "text": "View Collection",
                    "visibility": ""
                },
                "collections_collections_main_section_cta": {
                    "text": "View More",
                    "visibility": ""
                },
                "collections_collections_default_region_language": {
                    "text": "",
                    "visibility": " USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribean"
                },
                "collections_collections_section_name_13": {
                    "text": "Contract Upholstery",
                    "visibility": ""
                },
                "collections_collections_image_13": {
                    "text": "Hospitality uphostery - Lobby (Seating upholstery)  Family room",
                    "visibility": ""
                },
                "collections_collections_swatch_13": {
                    "text": "",
                    "visibility": ""
                },
                "collections_collections_header_13": {
                    "text": "Versatile and eclectic collections",
                    "visibility": ""
                },
                "collections_collections_cta_13": {
                    "text": "View Collection",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_13": {
                    "text": "View More",
                    "visibility": ""
                },
                "collections_collections_default_region_language_13": {
                    "text": "",
                    "visibility": " USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribean"
                },
                "collections_collections_section_name_14": {
                    "text": "Residential & General Purpose Upholstery",
                    "visibility": ""
                },
                "collections_collections_image_14": {
                    "text": "Residential sofa home",
                    "visibility": ""
                },
                "collections_collections_swatch_14": {
                    "text": "",
                    "visibility": ""
                },
                "collections_collections_header_14": {
                    "text": "Versatile and eclectic collections",
                    "visibility": ""
                },
                "collections_collections_cta_14": {
                    "text": "View Collection",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_14": {
                    "text": "View More",
                    "visibility": ""
                },
                "collections_collections_default_region_language_14": {
                    "text": "",
                    "visibility": " LATAM South America and Central América , México , Caribe "
                },
                "collections_collections_section_name_15": {
                    "text": "Marine & Outdoor",
                    "visibility": ""
                },
                "collections_collections_image_15": {
                    "text": "Yatch upholstery or boat upholstery",
                    "visibility": ""
                },
                "collections_collections_swatch_15": {
                    "text": "",
                    "visibility": ""
                },
                "collections_collections_header_15": {
                    "text": "Versatile and eclectic collections",
                    "visibility": ""
                },
                "collections_collections_cta_15": {
                    "text": "View Collection",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_15": {
                    "text": "View More",
                    "visibility": ""
                },
                "collections_collections_default_region_language_15": {
                    "text": "",
                    "visibility": "Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries)"
                },
                "collections_collections_section_name_16": {
                    "text": "Footwear ",
                    "visibility": ""
                },
                "collections_collections_image_16": {
                    "text": "Sport footwear / Casual footwear",
                    "visibility": ""
                },
                "collections_collections_swatch_16": {
                    "text": "",
                    "visibility": ""
                },
                "collections_collections_header_16": {
                    "text": "Versatile and eclectic collections",
                    "visibility": ""
                },
                "collections_collections_cta_16": {
                    "text": "View Collection",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_16": {
                    "text": "View More",
                    "visibility": ""
                },
                "collections_collections_default_region_language_16": {
                    "text": "",
                    "visibility": " LATAM South America and Central América , México , Caribe "
                },
                "collections_collections_section_name_17": {
                    "text": "Leathergoods & Sportballs",
                    "visibility": ""
                },
                "collections_collections_image_17": {
                    "text": "Handbag (Purse)",
                    "visibility": ""
                },
                "collections_collections_swatch_17": {
                    "text": "",
                    "visibility": ""
                },
                "collections_collections_header_17": {
                    "text": "Versatile and eclectic collections",
                    "visibility": ""
                },
                "collections_collections_cta_17": {
                    "text": "View Collection",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_17": {
                    "text": "View More",
                    "visibility": ""
                },
                "collections_collections_default_region_language_17": {
                    "text": "",
                    "visibility": " LATAM South America and Central América , México , Caribe "
                },
                "collections_collections_section_name_18": {
                    "text": "Industrial",
                    "visibility": ""
                },
                "collections_collections_image_18": {
                    "text": "Industrial ( Event Tent- Hangar)",
                    "visibility": ""
                },
                "collections_collections_swatch_18": {
                    "text": "",
                    "visibility": ""
                },
                "collections_collections_header_18": {
                    "text": "Versatile and eclectic collections",
                    "visibility": ""
                },
                "collections_collections_cta_18": {
                    "text": "View Collection",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_18": {
                    "text": "View More",
                    "visibility": ""
                },
                "collections_collections_default_region_language_18": {
                    "text": "",
                    "visibility": " LATAM South America and Central América , México , Caribe "
                },
                "contact_section_name": {
                    "text": "GET IN TOUCH",
                    "visibility": ""
                },
                "contact_image": {
                    "text": "",
                    "visibility": ""
                },
                "contact_header": {
                    "text": "Experience the difference",
                    "visibility": ""
                },
                "contact_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "contact_copy": {
                    "text": "Order a sample swatch from one of our collections today.",
                    "visibility": ""
                },
                "contact_cta": {
                    "text": "Get in Contact",
                    "visibility": ""
                },
                "contact_default_region_language": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters": {
                    "text": "Headquarters\r\nCL 61 Sur N. 43 A – 290\r\nSabaneta, Antioquia 055450\r\nColombia",
                    "visibility": ""
                },
                "footer_contact": {
                    "text": "(create link to contact section)",
                    "visibility": ""
                },
                "footer_links": {
                    "text": "Home",
                    "visibility": ""
                },
                "footer_social_media_channels": {
                    "text": "Facebook",
                    "visibility": ""
                },
                "footer_copy": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta": {
                    "text": "",
                    "visibility": ""
                },
                "footer_default_region_language": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_25": {
                    "text": "About",
                    "visibility": ""
                },
                "footer_social_media_channels_25": {
                    "text": "Twitter",
                    "visibility": ""
                },
                "footer_copy_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_default_region_language_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_26": {
                    "text": "Collections",
                    "visibility": ""
                },
                "footer_social_media_channels_26": {
                    "text": "Instagram",
                    "visibility": ""
                },
                "footer_copy_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_default_region_language_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_27": {
                    "text": "Resources",
                    "visibility": ""
                },
                "footer_social_media_channels_27": {
                    "text": "Linkedin",
                    "visibility": ""
                },
                "footer_copy_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_default_region_language_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_28": {
                    "text": "Terms & Conditions ",
                    "visibility": ""
                },
                "footer_social_media_channels_28": {
                    "text": "YouTube",
                    "visibility": ""
                },
                "footer_copy_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_default_region_language_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_29": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_29": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_29": {
                    "text": "Privacy Policy",
                    "visibility": ""
                },
                "footer_social_media_channels_29": {
                    "text": "social@nuvantglobal.com",
                    "visibility": ""
                },
                "footer_copy_29": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_29": {
                    "text": "",
                    "visibility": ""
                },
                "footer_default_region_language_29": {
                    "text": "",
                    "visibility": ""
                }
            },
            "es": {
                "pfa_pfa_1_section_name": {
                    "text": "\nAutomotriz",
                    "visibility": "USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribean"
                },
                "pfa_pfa_1_image": {
                    "text": "\nAutomotriz",
                    "visibility": ""
                },
                "pfa_pfa_1_header": {
                    "text": "Moderno, elegante y duradero",
                    "visibility": ""
                },
                "pfa_pfa_1_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "pfa_pfa_1_body": {
                    "text": "Fabricamos productos de la más alta calidad diseñadas para el mercado de tapicería automotriz, las cuales cumplen con las estrictas especificaciones y exigencias del sector en calidad, durabilidad y seguridad.",
                    "visibility": ""
                },
                "pfa_pfa_1_cta": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "pfa_pfa_2_section_name": {
                    "text": "Tapicería Contract e Institucional",
                    "visibility": ""
                },
                "pfa_pfa_2_image": {
                    "text": "Hospitality - Lobby upholstery furniture",
                    "visibility": ""
                },
                "pfa_pfa_2_header": {
                    "text": "\nMarcando estándares",
                    "visibility": ""
                },
                "pfa_pfa_2_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "pfa_pfa_2_body": {
                    "text": "Más allá de marcar tendencia a nivel mundial, presentamos una variada gama de colores que permiten crear espacios dinámicos y conformables.",
                    "visibility": ""
                },
                "pfa_pfa_2_cta": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "pfa_pfa_3_section_name": {
                    "text": "Tapicería Contract e Institucional",
                    "visibility": ""
                },
                "pfa_pfa_3_image": {
                    "text": "Upholstered furniture (example Maharam)",
                    "visibility": ""
                },
                "pfa_pfa_3_header": {
                    "text": "\nEstilo y esencia",
                    "visibility": ""
                },
                "pfa_pfa_3_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "pfa_pfa_3_body": {
                    "text": "Nos enorgullece poder ofrecer productos atractivos de alto desempeño en una gran variedad de acabados y colores, cumpliendo con los estrictos estándares de calidad, durabilidad y limpieza.",
                    "visibility": ""
                },
                "pfa_pfa_3_cta": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "about_us_about_us_1_section_name": {
                    "text": "QUIÉNES SOMOS",
                    "visibility": ""
                },
                "about_us_about_us_1_image": {
                    "text": "Image #1 Company fotos",
                    "visibility": ""
                },
                "about_us_about_us_1_header": {
                    "text": "Una empresa global dedicada al diseño y a la fabricación de textiles recubiertos.",
                    "visibility": ""
                },
                "about_us_about_us_1_subheader": {
                    "text": "Su socio confiable, enfocado en ofrecer la más alta calidad y servicio.",
                    "visibility": ""
                },
                "about_us_about_us_1_body": {
                    "text": "Nuvant atiende a los diferentes mercados a nivel mundial y se esfuerza constantemente por desarrollar nuevos productos de alta especificación técnica. Nuestros productos con su excelente desempeño y durabilidad, pueden ser utilizados en una amplia gama de aplicaciones, cumpliendo con los requisitos de los respectivos mercados.\nNuestra mayor fortaleza es la relación con nuestros clientes junto a un equipo de personas altamente capacitadas que trabajan hacia la excelencia y los más altos estándares de calidad. ",
                    "visibility": ""
                },
                "about_us_about_us_1_cta": {
                    "text": "",
                    "visibility": ""
                },
                "sustainability_section_name": {
                    "text": "Sostenibilidad",
                    "visibility": ""
                },
                "sustainability_image": {
                    "text": "",
                    "visibility": ""
                },
                "sustainability_header": {
                    "text": "Creciendo siendo sostenibles",
                    "visibility": ""
                },
                "sustainability_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "sustainability_body": {
                    "text": "En cada paso que damos, estamos comprometidos con la optimización de los procesos para reducir la huella de carbono.",
                    "visibility": ""
                },
                "sustainability_cta": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_section_name": {
                    "text": "Certificaciones",
                    "visibility": ""
                },
                "certifications_image": {
                    "text": "",
                    "visibility": ""
                },
                "certifications_header": {
                    "text": "Calidad certificada",
                    "visibility": ""
                },
                "certifications_subheader": {
                    "text": "N/A",
                    "visibility": ""
                },
                "certifications_body": {
                    "text": "Nuestros procesos relacionados con la producción y revisión han sido certificados por organismos internacionales.",
                    "visibility": ""
                },
                "certifications_cta": {
                    "text": "",
                    "visibility": ""
                },
                "collections_section_name": {
                    "text": "",
                    "visibility": ""
                },
                "collections_image": {
                    "text": "",
                    "visibility": ""
                },
                "collections_swatch": {
                    "text": "",
                    "visibility": ""
                },
                "collections_header": {
                    "text": "Colecciones versátiles y diversas",
                    "visibility": ""
                },
                "collections_cta": {
                    "text": "",
                    "visibility": ""
                },
                "collections_main_section_cta": {
                    "text": "",
                    "visibility": ""
                },
                "collections_visibilidad": {
                    "text": "",
                    "visibility": ""
                },
                "collections_collections_section_name": {
                    "text": "Automotriz",
                    "visibility": ""
                },
                "collections_collections_image": {
                    "text": "Interior automotive high quality upholstery (Trim interior car)",
                    "visibility": ""
                },
                "collections_collections_swatch": {
                    "text": "Automotriz",
                    "visibility": ""
                },
                "collections_collections_header": {
                    "text": "Colecciones versátiles y diversas",
                    "visibility": ""
                },
                "collections_collections_cta": {
                    "text": "Ver colección",
                    "visibility": ""
                },
                "collections_collections_main_section_cta": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "collections_collections_visibilidad": {
                    "text": "USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries); LATAM South America and Central América , México , Caribean\n",
                    "visibility": ""
                },
                "collections_collections_section_name_13": {
                    "text": "Tapicería Contract e Institucional",
                    "visibility": ""
                },
                "collections_collections_image_13": {
                    "text": "Hospitality uphostery - Lobby (Seating upholstery)  Family room",
                    "visibility": ""
                },
                "collections_collections_swatch_13": {
                    "text": "Tapicería Contract e Institucional",
                    "visibility": ""
                },
                "collections_collections_header_13": {
                    "text": "Colecciones versátiles y diversas",
                    "visibility": ""
                },
                "collections_collections_cta_13": {
                    "text": "Ver colección",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_13": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "collections_collections_visibilidad_13": {
                    "text": "\nEUSA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries); LATAM South America and Central América , México , Caribean\n",
                    "visibility": ""
                },
                "collections_collections_section_name_14": {
                    "text": "Tapicería Hogar ",
                    "visibility": ""
                },
                "collections_collections_image_14": {
                    "text": "Residential sofa home",
                    "visibility": ""
                },
                "collections_collections_swatch_14": {
                    "text": "Tapicería Hogar ",
                    "visibility": ""
                },
                "collections_collections_header_14": {
                    "text": "Colecciones versátiles y diversas",
                    "visibility": ""
                },
                "collections_collections_cta_14": {
                    "text": "Ver colección",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_14": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "collections_collections_visibilidad_14": {
                    "text": "LATAM South America and Central América , México , Caribe        \n",
                    "visibility": ""
                },
                "collections_collections_section_name_15": {
                    "text": "Tapicería Náutica y Exteriores",
                    "visibility": ""
                },
                "collections_collections_image_15": {
                    "text": "Yatch upholstery or boat upholstery",
                    "visibility": ""
                },
                "collections_collections_swatch_15": {
                    "text": "Tapicería Náutica y Exteriores",
                    "visibility": ""
                },
                "collections_collections_header_15": {
                    "text": "Colecciones versátiles y diversas",
                    "visibility": ""
                },
                "collections_collections_cta_15": {
                    "text": "Ver colección",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_15": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "collections_collections_visibilidad_15": {
                    "text": "USA & Canada, Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries); LATAM South America and Central América , México , Caribean\n",
                    "visibility": ""
                },
                "collections_collections_section_name_16": {
                    "text": "Calzado",
                    "visibility": ""
                },
                "collections_collections_image_16": {
                    "text": "Sport footwear / Casual footwear",
                    "visibility": ""
                },
                "collections_collections_swatch_16": {
                    "text": "Calzado",
                    "visibility": ""
                },
                "collections_collections_header_16": {
                    "text": "Colecciones versátiles y diversas",
                    "visibility": ""
                },
                "collections_collections_cta_16": {
                    "text": "Ver colección",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_16": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "collections_collections_visibilidad_16": {
                    "text": "LATAM South America and Central América , México , Caribe\t\n",
                    "visibility": ""
                },
                "collections_collections_section_name_17": {
                    "text": "Marroquinería y Balones",
                    "visibility": ""
                },
                "collections_collections_image_17": {
                    "text": "Handbag (Purse)",
                    "visibility": ""
                },
                "collections_collections_swatch_17": {
                    "text": "Marroquinería y Balones",
                    "visibility": ""
                },
                "collections_collections_header_17": {
                    "text": "Colecciones versátiles y diversas",
                    "visibility": ""
                },
                "collections_collections_cta_17": {
                    "text": "Ver colección",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_17": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "collections_collections_visibilidad_17": {
                    "text": "LATAM South America and Central América , México , Caribe\t",
                    "visibility": ""
                },
                "collections_collections_section_name_18": {
                    "text": "Industrial",
                    "visibility": ""
                },
                "collections_collections_image_18": {
                    "text": "Industrial ( Event Tent- Hangar)",
                    "visibility": ""
                },
                "collections_collections_swatch_18": {
                    "text": "Industrial",
                    "visibility": ""
                },
                "collections_collections_header_18": {
                    "text": "Colecciones versátiles y diversas",
                    "visibility": ""
                },
                "collections_collections_cta_18": {
                    "text": "Ver colección",
                    "visibility": ""
                },
                "collections_collections_main_section_cta_18": {
                    "text": "Ver más",
                    "visibility": ""
                },
                "collections_collections_visibilidad_18": {
                    "text": "LATAM South America and Central América , México , Caribe\t",
                    "visibility": ""
                },
                "contact_section_name": {
                    "text": "\nCONTÁCTENOS",
                    "visibility": ""
                },
                "contact_image": {
                    "text": "",
                    "visibility": ""
                },
                "contact_header": {
                    "text": "Experimenta nuestra tecnología",
                    "visibility": ""
                },
                "contact_subheader": {
                    "text": "",
                    "visibility": ""
                },
                "contact_copy": {
                    "text": "Solicite hoy una muestra",
                    "visibility": ""
                },
                "contact_cta": {
                    "text": "\nContáctenos ",
                    "visibility": ""
                },
                "contact_visibilidad": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters": {
                    "text": "Oficina principal\nCL 61 Sur N. 43 A – 290\nSabaneta, Antioquia 055450\nColombia\nOficinas centrales",
                    "visibility": ""
                },
                "footer_contact": {
                    "text": "(create link to contact section)",
                    "visibility": ""
                },
                "footer_links": {
                    "text": "\nInicio",
                    "visibility": ""
                },
                "footer_social_media_channels": {
                    "text": "Facebook",
                    "visibility": ""
                },
                "footer_copy": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta": {
                    "text": "",
                    "visibility": ""
                },
                "footer_visibilidad": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_25": {
                    "text": "\nQuiénes Somos",
                    "visibility": ""
                },
                "footer_social_media_channels_25": {
                    "text": "Twitter",
                    "visibility": ""
                },
                "footer_copy_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_visibilidad_25": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_26": {
                    "text": "\nColecciones",
                    "visibility": ""
                },
                "footer_social_media_channels_26": {
                    "text": "Instagram",
                    "visibility": ""
                },
                "footer_copy_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_visibilidad_26": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_27": {
                    "text": "\nRecursos",
                    "visibility": ""
                },
                "footer_social_media_channels_27": {
                    "text": "Linkedin",
                    "visibility": ""
                },
                "footer_copy_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_visibilidad_27": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_28": {
                    "text": "\nPolítica de manejo de datos",
                    "visibility": ""
                },
                "footer_social_media_channels_28": {
                    "text": "YouTube",
                    "visibility": ""
                },
                "footer_copy_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_visibilidad_28": {
                    "text": "",
                    "visibility": ""
                },
                "footer_headquarters_29": {
                    "text": "",
                    "visibility": ""
                },
                "footer_contact_29": {
                    "text": "",
                    "visibility": ""
                },
                "footer_links_29": {
                    "text": "",
                    "visibility": ""
                },
                "footer_social_media_channels_29": {
                    "text": "social@nuvantglobal.com",
                    "visibility": ""
                },
                "footer_copy_29": {
                    "text": "",
                    "visibility": ""
                },
                "footer_cta_29": {
                    "text": "",
                    "visibility": ""
                },
                "footer_visibilidad_29": {
                    "text": "",
                    "visibility": ""
                }
            }
        }
    }, {}], 13: [function (require, module, exports) {
        module.exports = { "en": { "care_cleaning_guide_title": { "text": "", "visibility": "" }, "care_cleaning_guide_copy": { "text": "Vinyl upholstery is well known for its durability, physical strength, and stain and water resistance. However, some maintenance steps must be carried out on a regular basis to extend its life. The amount of use and ambient conditions will determine the frequency and type of cleaning that the vinyl should have. It is not unusual for stains and dyes from clothing fabrics to be absorbed into the vinyl matrix. Care must be taken to avoid removing plasticizer from the vinyl through the use of strong solvents, as this will cause the vinyl to become brittle and its service life will be greatly reduced. The steps below can serve as a guide for the care of vinyl fabric:", "visibility": "" }, "care_cleaning_guide_cta": { "text": "", "visibility": "" }, "care_cleaning_guide_region": { "text": " USA & Canada Europe, North Africa, Middle East, Russia, UK; Global / General (Asia, Australia , other countries);  LATAM South America and Central América , México , Caribe ", "visibility": "" }, "care_cleaning_guide_title_2": { "text": "Regular Maintenance", "visibility": "" }, "care_cleaning_guide_copy_2": { "text": "REGULAR MAINTENANCE\n\n1. Use a mixture of mild soap (neutral pH) and water (1 part soap to 10 parts water) to clean the vinyl using a soft white cloth or sponge.\n2. Use clean water with a soft cloth to remove excess soap.\n3. Wipe dry immediately with a clean, dry, white cloth. There should be no soap residue on the vinyl surface.\n4. Light colors, such as white, require a higher cleaning frequency.\n\nNOTE: If dirt is embedded, you can rub the vinyl moderately with a soft bristle brush and soapy solution. Then repeat steps 2 and 3.", "visibility": "" }, "care_cleaning_guide_cta_2": { "text": "View More", "visibility": "" }, "care_cleaning_guide_region_2": { "text": "", "visibility": "" }, "care_cleaning_guide_title_3": { "text": "In Case Of Stains And Spills", "visibility": "" }, "care_cleaning_guide_copy_3": { "text": "IN CASE OF STAINS AND SPILLS\n\n1. The key to keeping vinyl upholstery clean is to remove grease, dirt and debris as quickly as possible after the spill occurs.\n2. DO NOT use abrasive or solvent cleaners, especially those that contain concentrated bleach, petroleum distillates, or concentrated detergents.\n3. To remove dry stains, vinyl can be cleaned with a mixture of mild detergent powder and water (use 1 part mild detergent powder and 5 parts water). Apply the solution to the stain and wait a minute or two for the detergent to work. Then, gently rub the area and rinse with plenty of clean water. Be sure you have removed all soapy residue. Dry with a clean dry cloth.\n4. Liquid spills (coffee, tea, liquor, wine, suntan lotion, soft drinks, etc.). If the spill is cleaned before it dries, it can be easily removed using an absorbent paper towel. Clean the area with a damp cloth, and then dry with a clean cloth. If the stain has already dried, go to step 3.\n5. Sauces and thick spills (tomato sauce, mustard, etc.): collect as much of the spill as possible with a dry cloth, rotating the cloth and without pressing it on the vinyl surface. Repeat this process if necessary, and if the residue remains, go to step 3. Clean the area with a damp cloth, and then dry with a clean cloth.\n6. Blood, Urine, Bird droppings: wipe with a sponge moistened with a mixture of soapy water and household ammonia (1 part of neutral pH soap, 5 parts of household ammonia and 5 parts of water). Remove the soap with a damp white cloth until no soapy residue remains. If stain remains, it should be washed with a diluted bleach solution (10% bleach, 90% water). Finally, dry with a clean cloth.\n7. Lipstick, grease, oil, eyeshadow, shoe polish wax: apply a small amount of household cleaner (such as Fantastik®, Formula 409®, Fabuloso® or the like) mixed with water (in a 1: 1 ratio ) using a cloth and rub. Wipe with a damp cloth until no cleaner residue remains, then wipe dry with a clean cloth.\n8. Ballpoint pen, permanent marker: these inks could permanently stain the vinyl. Cleaning immediately with a 1: 1 mixture of 99.5% Isopropyl Alcohol and Water can remove much of the stain. Then wipe the area with a damp cloth and then dry with a clean cloth.\n9. Our products do not transfer color to other materials, but some garments with low quality dyeing processes can transfer their color to vinyl material. Apply a small amount of household cleaner (such as Fantastik®, Formula 409®, Fabuloso® or the like) mixed with water (in a 1: 1 ratio) using a cloth and rub. Wipe with a damp cloth until no residue from the cleaner and then wipe dry with a clean cloth. Remove stains as soon as they are detected. Up to 100% cleaning is obtained if these stains are cleaned within 24 hours, up to 80% after 48 hours and up to 50% after one week.", "visibility": "" }, "care_cleaning_guide_cta_3": { "text": "View More", "visibility": "" }, "care_cleaning_guide_region_3": { "text": "", "visibility": "" }, "care_cleaning_guide_title_4": { "text": "Special Precautions With Vinyl Fabrics", "visibility": "" }, "care_cleaning_guide_copy_4": { "text": "SPECIAL PRECAUTIONS WITH VINYL FABRICS\n\n1. The cloths that must be used for both cleaning and drying must always be white.\n2. The brushes that are recommended in some points should always be of soft bristles.\n3. Powder abrasives, abrasive cleaning products, metal sponges or brushes, and industrial cleaners are not recommended for vinyl cleaning.\n4. Cleaners based on citrus extracts are not recommended.\n5. Unspecified cleaners should not be used. Additionally, strong lacquers, inks, cleaners and detergents, solvents such as paint thinner, acetone and MEK, can be effective in removing stains, but cause immediate damage and contribute to material deterioration. The use of these cleaners is at your own risk.\n6. Wax should never be used on vinyl, as it will cause premature cracking.\n7. High power or pressure equipment should never be used to wash the vinyl.\n8. Always follow the safety recommendations of the manufacturer of cleaning products.", "visibility": "" }, "care_cleaning_guide_cta_4": { "text": "View More", "visibility": "" }, "care_cleaning_guide_region_4": { "text": "", "visibility": "" } }, "es": { "care_cleaning_guide_title": { "text": "", "visibility": "" }, "care_cleaning_guide_copy": { "text": "La tapicería de vinilo es conocida por su durabilidad, resistencia física y resistencia a las manchas, mugre y agua. Sin embargo, es importante llevar a cabo algunas técnicas de limpieza y desinfección en su mantenimiento regular. El uso y las condiciones ambientales determinarán la frecuencia y el tipo de limpieza que el vinilo debe tener. No es raro que las manchas y  colorantes de las prendas de vestir se absorban en la matriz vinílica. Se debe tener especial cuidado con el uso de solventes fuertes para evitar la extracción de plastificante del vinilo, ya que esto causará que se vuelva quebradizo y se reducirá notablemente su vida útil.\n \nA continuación, se establecen algunas técnicas que se deben tener presente como guía para mantener la vida útil de las telas vinílicas:\n\n\n\n", "visibility": "" }, "care_cleaning_guide_cta": { "text": "", "visibility": "" }, "care_cleaning_guide_region": { "text": "EE.UU. y Canadá Europa, Africa del Norte, Oriente Medio, Rusia, Reino Unido; Global / General (Asia, Australia, otros países); LATAM: Sudamérica y Centroamérica, México, Caribe\n", "visibility": "" }, "care_cleaning_guide_title_2": { "text": "MANTENIMIENTO REGULAR", "visibility": "" }, "care_cleaning_guide_copy_2": { "text": "MANTENIMIENTO REGULAR\n\n1. Use una mezcla de jabón suave de PH neutro y agua (1 parte de jabón por 10 de agua) para limpiar el vinilo usando un paño suave de color blanco o una esponja.\n2. Use agua limpia con un paño suave para remover el exceso de jabón.\n3. Seque inmediatamente con un paño de color blanco limpio y seco. No deben quedar residuos de jabón sobre la superficie del vinilo.\n4. Los colores claros como el blanco requieren mayor frecuencia de limpieza.\n\n\nNOTA: Si existe suciedad incrustada, puede frotar el vinilo moderadamente con un cepillo de cerdas suaves y solución jabonosa, luego, repita el punto 2 y 3.\n\n\n\n\n\n", "visibility": "" }, "care_cleaning_guide_cta_2": { "text": "Ver más", "visibility": "" }, "care_cleaning_guide_region_2": { "text": "", "visibility": "" }, "care_cleaning_guide_title_3": { "text": "EN CASO DE MANCHAS Y DERRAMES", "visibility": "" }, "care_cleaning_guide_copy_3": { "text": "EN CASO DE MANCHAS Y DERRAMES\n\n1. La clave para mantener limpia la tapicería de vinilo es eliminar las grasa, suciedad y residuos tan rápido como sea posible, después de que ocurra el derrame. \n\n2. NO use limpiadores abrasivos o solventes, especialmente aquellos que contienen blanqueador concentrado, destilados de petróleo o detergentes concentrados.\n\n3. Para quitar manchas secas, el vinilo puede ser limpiado con una mezcla de detergente suave en polvo y agua (use 1 parte de detergente suave en polvo y 5 partes de agua). Aplique la solución a la mancha y espere uno o dos minutos para que actúe el detergente. Luego, frote suavemente el área y enjuague con abundante agua limpia. Asegúrese de haber removido todos los residuos de jabón. Seque con un paño limpio y seco.\n\n4. Derrames de líquidos (café, té, licor, vino, loción, bronceador, refrescos, etcétera). Si se limpia el derrame antes que se seque, se puede eliminar fácilmente con una toalla de papel absorbente. Después, limpie el área con un paño húmedo y finalmente seque con otro limpio. Si la mancha ya se ha secado, vaya al punto 3.\n\n5. Salsas y líquidos espesos (salsa de tomate, mostaza, etcétera): Con un paño seco, remueva la mayor cantidad posible del líquido con movimientos circulares y sin presionar sobre la superficie de vinilo. Si es necesario, repita este proceso y si quedan residuos, vaya al paso 3. Limpie el área con un paño húmedo y luego seque con un paño limpio.\n\n6. Sangre, orina o excrementos de aves: Limpie con una esponja y una mezcla de agua jabonosa y amoníaco de uso doméstico ( 1 parte de jabón PH neutro, 5 de amoníaco de uso doméstico y 5 de agua). Retire cualquier residuo de la mezcla con un paño húmedo de color blanco. En caso de que queden remanentes de la mancha, se debe lavar con una solución de blanqueador diluido (10% blanqueador y 90% agua). Por último, seque con un paño limpio.\n\n7. Lápiz labial, grasa, aceite, maquillaje de ojos, cera para limpiar zapatos: Con un paño limpio, aplique una pequeña cantidad de limpiador de uso doméstico (Fantastik®, Formula 409®, Fabuloso® o similares) mezclado con agua (en proporción 1:1). Frote el área hasta quitar la mancha y después remueva todos los residuos de la solución con un paño limpio.\n\n8. Bolígrafo o marcador permanente: Estas tintas pueden manchar el vinilo de forma permanente. Para eliminar gran parte de la mancha, frote con una mezcla 1:1 de alcohol isopropílico al 99.5% y otra igual de agua para remover gran parte de la mancha, utilizando un paño blanco. Limpie utilizando un paño húmedo y luego seque con un paño limpio y seco.\n\n9. Nuestros productos no transfieren el color a otros materiales, pero algunas prendas con procesos de teñido de baja calidad pueden transferir su color al material de vinilo. Si eso ocurre, limpie con un paño limpio y una pequeña cantidad de limpiador de uso doméstico (Fantastik®, Formula 409®, Fabuloso® o similar) mezclada con una proporción 1:1 de agua. Remueva los residuos de la mezcla con un paño húmedo y después seque con un paño limpio. Quite las manchas tan pronto las detecte. Estas pueden desaparecer hasta un 100% si se limpian dentro de 24 horas, hasta un 80% si espera 48 y hasta un 50% si son limpiadas después de una semana.\n", "visibility": "" }, "care_cleaning_guide_cta_3": { "text": "Ver más", "visibility": "" }, "care_cleaning_guide_region_3": { "text": "", "visibility": "" }, "care_cleaning_guide_title_4": { "text": "PRECAUCIONES ESPECIALES CON TELAS DE VINILO", "visibility": "" }, "care_cleaning_guide_copy_4": { "text": "PRECAUCIONES ESPECIALES CON TELAS DE VINILO\n1. Los paños que se deben usar, tanto para la limpieza como para el secado, siempre deben ser de color blanco.\n2. Los cepillos recomendados en algunos puntos aquí explicados deben ser de cerdas suaves.\n3. No se recomienda usar en la limpieza del vinilo polvos abrasivos, productos de limpieza abrasivos, esponjas y cepillos metálicos ni limpiadores industriales.\n4. No se recomienda limpiadores basados en extractos cítricos.\n5. No se deben usar limpiadores no especificados en estas instrucciones. Llacas, tintas, limpiadores, detergentes fuertes y disolventes como diluyentes de pintura, acetona y MEK pueden ser eficaces para eliminar manchas, pero causan daños inmediatos en el vinilo y contribuyen a su deterioro. El uso de estos limpiadores es bajo su propio riesgo.\n6. Nunca se deben usar ceras sobre el vinilo, causarán resquebrajamiento prematuro y grietas.\n7. Nunca use equipo de alta potencia o presión para lavar el vinilo.\n8. Siga siempre las recomendaciones de seguridad del fabricante de productos de limpieza.\n\n\n\n\n\n\n\n", "visibility": "" }, "care_cleaning_guide_cta_4": { "text": "Ver más", "visibility": "" }, "care_cleaning_guide_region_4": { "text": "", "visibility": "" } } }
    }, {}], 14: [function (require, module, exports) {

        module.exports.translateTimeline = (text) => {
            let timeline = {}
            let timeline_array = text.split('\n').filter(v => !!v);
            timeline['subheader'] = timeline_array[1]
            timeline_array.forEach((t, idx) => {
                if (idx >= 2 && !(idx % 2)) {
                    timeline[t.trim()] = timeline_array[idx + 1]
                }
            })
            // console.log(timeline_array, timeline)
            Object.entries(timeline).forEach(([year, val]) => {
                $(`#timeline-${year}`).html(val)
            })
        }




        module.exports.translateCareCopy = (k, v) => {
            const copyNumIcons = {
                2: 'img/icons/ico_maintain.svg',
                3: 'img/icons/ico_spills.svg',
                4: 'img/icons/ico_special.svg',
            }
            let copy_match = k.match(/\d/);
            if (copy_match) {
                let num = copy_match[0];
                $(`#care_cleaning_guide_cta_${num}`).click((e) => {

                    let list = v.text.split(/\n\d\./);
                    // console.log(list)
                    let itemDivs = list.slice(1).map((l, idx) => `<div>${idx + 1}. ${l}</div><br />`)
                    // console.log(itemDivs)
                    $('.modal-title').html(`<img class='resources-title-icon' src=${copyNumIcons[num]}></img>${list[0]}`)
                    $('.modal-body').html(itemDivs)
                })
            }
        }

    }, {}], 15: [function (require, module, exports) {
        const COOKIE_NAME = "NUVANT_LANG"


        module.exports.setCookie = (lang) => {
            localStorage.setItem(COOKIE_NAME, lang)

        }

        module.exports.getCookie = () => {
            let cookie = window.localStorage.getItem(COOKIE_NAME)
            return cookie
        }
    }, {}]
}, {}, [3]);
