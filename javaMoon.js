import { scaleOrdinal } from 'https://esm.sh/d3-scale';

const colorScale = scaleOrdinal(['orangered', 'mediumblue', 'darkgreen', 'yellow']);

const labelsTopOrientation = new Set(['Apollo 12', 'Luna 2', 'Luna 20', 'Luna 21', 'Luna 24', 'LCROSS Probe']);

const moon = new Globe(document.getElementById('globeViz'))
    .globeImageUrl('./lunar_surface.jpg')
    .bumpImageUrl('./lunar_bumpmap.jpg')
    .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
    .showGraticules(true)
    .showAtmosphere(false)
    .labelText('label')
    .labelSize(1.7)
    .labelDotRadius(0.4)
    .labelDotOrientation(d => labelsTopOrientation.has(d.label) ? 'top' : 'bottom')
    .labelColor(d => colorScale(d.agency))
    .labelLabel(d => `
        <div><b>${d.label}</b></div>
        <div>${d.agency} - ${d.program} Program</div>
        <div>Landing on <i>${new Date(d.date).toLocaleDateString()}</i></div>
      `)
    .onLabelClick(d => {
        window.parent.postMessage({
            type: 'missionClicked',
            mission: d.label,
            coordinates: { lat: d.lat, lng: d.lng }
        }, '*');

    });

setTimeout(() => moon.pointOfView({ altitude: 1.75 }));

fetch('./moon_landings.json').then(r => r.json()).then(landingSites => {
    moon.labelsData(landingSites);
});

setTimeout(() => {
    const canvas = document.querySelector('#globeViz canvas');
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
    }
}, 1000);

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'centerMission' && event.data.coordinates) {
        const { lat, lng } = event.data.coordinates;
        moon.pointOfView({ lat, lng, altitude: 1.75 }, 2000);
    }
});