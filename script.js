document.getElementById('generateBtn').addEventListener('click', async () => {
    const pokemonInfo = document.getElementById('pokemonInfo');

    // Show loading spinner
    pokemonInfo.innerHTML = `
        <div class="d-flex justify-content-center mt-5">
            <div class="spinner">
                <div class="rect1"></div>
                <div class="rect2"></div>
                <div class="rect3"></div>
                <div class="rect4"></div>
                <div class="rect5"></div>
            </div>
        </div>
    `;

    const maxPokemon = 1010; // As of Gen IX
    const randomId = Math.floor(Math.random() * maxPokemon) + 1;
    const url = `https://pokeapi.co/api/v2/pokemon/${randomId}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Fetch abilities details
        const abilities = await Promise.all(
            data.abilities.map(async (a) => {
                const abilityRes = await fetch(a.ability.url);
                const abilityData = await abilityRes.json();
                // Get English description
                const effectEntry = abilityData.effect_entries.find(e => e.language.name === 'en');
                return {
                    name: a.ability.name,
                    effect: effectEntry ? effectEntry.short_effect : 'No description available.'
                };
            })
        );

        // Fetch location encounters
        const encountersRes = await fetch(data.location_area_encounters);
        const encountersData = await encountersRes.json();
        const locationsByVersion = {};
        encountersData.forEach(encounter => {
            const locationName = encounter.location_area.name.replace(/-/g, ' ');
            encounter.version_details.forEach(versionDetail => {
                const versionName = versionDetail.version.name;
                if (!locationsByVersion[versionName]) {
                    locationsByVersion[versionName] = new Set();
                }
                locationsByVersion[versionName].add(locationName);
            });
        });

        const locationsHtml = Object.entries(locationsByVersion).map(([version, locationsSet]) => {
            const formattedVersionName = version.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return `<li class="text-center"><strong>${formattedVersionName}:</strong> ${Array.from(locationsSet).join(', ')}</li>`;
        }).join('');

        // Prepare sprites HTML from the data object
        const spriteImages = [
            { name: 'Default', url: data.sprites.front_default },
            { name: 'Shiny', url: data.sprites.front_shiny },
            { name: 'Default (Back)', url: data.sprites.back_default },
            { name: 'Shiny (Back)', url: data.sprites.back_shiny },
        ].filter(sprite => sprite.url);

        const spritesHtml = spriteImages.length > 0 ? spriteImages.map(sprite => `
            <div class="text-center">
                <img src="${sprite.url}" alt="${data.name} ${sprite.name}" class="sprite-img bg-light rounded p-1">
                <p class="small mb-0 text-muted">${sprite.name}</p>
            </div>
        `).join('') : '<p>No sprites available.</p>';

        const mainImageUrl = data.sprites.other?.['official-artwork']?.front_default
                          || data.sprites.front_default;

        pokemonInfo.innerHTML = `
            <h2>${data.name.charAt(0).toUpperCase() + data.name.slice(1)}</h2>
            <p>Pokedex ID: #${data.id}</p>
            <img src="${mainImageUrl}" alt="${data.name}">
            <p>TYPE: ${data.types.map(t => t.type.name.toUpperCase()).join(' / ')}</p>

            <div class="container">
                <div class="row">
                    <div class="col">
                    <div class="card">
                        <div class="card-body">
                            <h3>INFO</h3>
                            <ul>
                                <li><strong>HEIGHT:</strong> ${data.height / 10} m</li>
                                <li><strong>WEIGHT:</strong> ${data.weight / 10} kg</li>

                            </ul>
                        </div>
                        <div class="card-body">
                            <h3>STATS</h3>
                            <ul>
                                ${data.stats.map(s => `<li><strong>${s.stat.name.toUpperCase()}:</strong> ${s.base_stat}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="card-body">
                            <h3>ABILITIES</h3>
                            <ul>
                                ${abilities.map(a => `<li><strong>${a.name.toUpperCase()}:</strong> ${a.effect}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    </div>


                </div>

                <div class="row">
                <div class="card w-100 mt-3">
                    <div class="card-body">
                        <h3>SPRITES</h3>
                        <div class="d-flex flex-wrap justify-content-center gap-3">
                            ${spritesHtml}
                        </div>
                </div>
                </div>

                <div class="row">
                     <div class="card w-100 mt-3">
                        <div class="card-body text-center">
                            <h3>LOCATION AREA ENCOUNTERS</h3>
                            ${locationsHtml.length > 0 ? `<ul>${locationsHtml}</ul>` : '<p class="card-text mb-0">Not found in the wild.</p>'}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        `;
    } catch (error) {
        pokemonInfo.innerHTML = '<p class="text-center text-danger">Error fetching Pokémon data. Please try again.</p>';
    }
});