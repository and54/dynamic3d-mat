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