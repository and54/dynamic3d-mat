
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
