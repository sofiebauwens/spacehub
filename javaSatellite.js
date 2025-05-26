const observer = new MutationObserver(() => {
    const canvas = document.querySelector('#chart canvas');
    if (canvas) {
        canvas.style.cursor = 'grab';

        canvas.addEventListener('mousedown', () => {
            canvas.style.cursor = 'grabbing';
        });

        canvas.addEventListener('mouseup', () => {
            canvas.style.cursor = 'grab';
        });

        canvas.addEventListener('mouseleave', () => {
            canvas.style.cursor = 'grab';
        });

        observer.disconnect();
    }
});

observer.observe(document.getElementById('chart'), { childList: true, subtree: true });
import * as satellite from 'https://esm.sh/satellite.js';

const EARTH_RADIUS_KM = 6371;
const TIME_STEP = 1 * 300;

const timeLogger = document.getElementById('time-log');

const world = new Globe(document.getElementById('chart'))
    .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
    .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
    .particleLat('lat')
    .particleLng('lng')
    .particleAltitude('alt')
    .particlesColor(() => 'palegreen');

setTimeout(() => world.pointOfView({ altitude: 1.75 }));

fetch('/space-track-leo.txt').then(r => r.text()).then(rawData => {
    const tleData = rawData.replace(/\r/g, '')
        .split(/\n(?=[^12])/)
        .filter(d => d)
        .map(tle => tle.split('\n'));
    const satData = tleData.map(([name, ...tle]) => ({
        satrec: satellite.twoline2satrec(...tle),
        name: name.trim().replace(/^0 /, '')
    }))
        .filter(d => !!satellite.propagate(d.satrec, new Date())?.position);

    let time = new Date();
    (function frameTicker() {
        requestAnimationFrame(frameTicker);

        time = new Date(+time + TIME_STEP);
        timeLogger.innerText = time.toString();

        const gmst = satellite.gstime(time);
        satData.forEach(d => {
            const eci = satellite.propagate(d.satrec, time);
            if (eci)  {
                if (eci.position) {
                    const gdPos = satellite.eciToGeodetic(eci.position, gmst);
                    d.lat = satellite.radiansToDegrees(gdPos.latitude);
                    d.lng = satellite.radiansToDegrees(gdPos.longitude);
                    d.alt = gdPos.height / EARTH_RADIUS_KM
                }
            }

        });

        world.particlesData([satData.filter(d => !isNaN(d.lat) && !isNaN(d.lng) && !isNaN(d.alt))]);
    })();
});