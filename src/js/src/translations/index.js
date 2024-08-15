
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
    contact_us: { locations: contact_us_2, input_fields: contact_us},
    certifications
}