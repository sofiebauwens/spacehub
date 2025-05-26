document.addEventListener('DOMContentLoaded', function() {
    const calendar = document.getElementById('calendar');
    const currentMonthElement = document.getElementById('current-month');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const todayButton = document.getElementById('today-button');
    const overlay = document.getElementById('overlay');
    const eventDetails = document.getElementById('event-details');
    const closeButton = document.getElementById('close-button');
    const loading = document.getElementById('loading');
    const launchFilter = document.getElementById('launch-filter');
    const eventFilter = document.getElementById('event-filter');
    const viewSwitcher = document.getElementById('view-switcher');

    const API_BASE_URL = 'https://lldev.thespacedevs.com/2.3.0';

    let currentDate = new Date();
    let launches = [];
    let spaceEvents = [];
    let filteredLaunches = [];
    let filteredSpaceEvents = [];
    let combinedEvents = [];
    let filteredCombinedEvents = [];
    let currentLaunchFilter = 'all';
    let currentEventFilter = 'all';
    let currentView = 'combined';

    updateCalendar();

    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });
    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });
    todayButton.addEventListener('click', () => {
        currentDate = new Date();
        updateCalendar();
    });
    closeButton.addEventListener('click', closeEventDetails);
    overlay.addEventListener('click', closeEventDetails);

    function setInitialFilterState() {
        launchFilter.style.display = 'none';
        eventFilter.style.display = 'none';

        viewSwitcher.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active');
        });

        const combinedViewButton = viewSwitcher.querySelector('[data-view="combined"]');
        if (combinedViewButton) {
            combinedViewButton.classList.add('active');
        }
    }

    setInitialFilterState();

    viewSwitcher.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            viewSwitcher.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            currentView = this.dataset.view;

            resetFilters();

            if (currentView === 'launches') {
                launchFilter.style.display = 'flex';
                eventFilter.style.display = 'none';
                filteredSpaceEvents = [];
            } else if (currentView === 'events') {
                launchFilter.style.display = 'none';
                eventFilter.style.display = 'flex';
                filteredLaunches = [];
            } else {
                launchFilter.style.display = 'none';
                eventFilter.style.display = 'none';
                filteredLaunches = [...launches];
                filteredSpaceEvents = [...spaceEvents];
            }
            applyFilters();
            drawCalendar();
        });
    });

    launchFilter.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            launchFilter.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            currentLaunchFilter = this.dataset.type;

            if (currentLaunchFilter === 'all') {
                resetEventFilters();
            }

            applyFilters();
            drawCalendar();
        });
    });

    eventFilter.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            eventFilter.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            currentEventFilter = this.dataset.type;

            if (currentEventFilter === 'all') {
                resetLaunchFilters();
            }

            applyFilters();
            drawCalendar();
        });
    });

    function resetFilters() {
        resetLaunchFilters();
        resetEventFilters();
    }

    function resetLaunchFilters() {
        currentLaunchFilter = 'all';
        launchFilter.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active');
        });
        const allLaunchButton = launchFilter.querySelector('[data-type="all"]');
        if (allLaunchButton) {
            allLaunchButton.classList.add('active');
        }
    }

    function resetEventFilters() {
        currentEventFilter = 'all';
        eventFilter.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active');
        });
        const allEventButton = eventFilter.querySelector('[data-type="all"]');
        if (allEventButton) {
            allEventButton.classList.add('active');
        }
    }

    function applyFilters() {
        if (currentView === 'launches') {
            if (currentLaunchFilter === 'all') {
                filteredLaunches = [...launches];
            } else {
                filteredLaunches = launches.filter(launch => launch.type === currentLaunchFilter);
            }
            filteredSpaceEvents = [];
        }
        else if (currentView === 'events') {
            if (currentEventFilter === 'all') {
                filteredSpaceEvents = [...spaceEvents];
            } else {
                filteredSpaceEvents = spaceEvents.filter(event => event.type === currentEventFilter);
            }
            filteredLaunches = [];
        }
        else {
            filteredLaunches = [...launches];
            filteredSpaceEvents = [...spaceEvents];
        }

        combinedEvents = [...launches, ...spaceEvents];
        filteredCombinedEvents = [...filteredLaunches, ...filteredSpaceEvents];

        console.log(`Applied filters - Current view: ${currentView}`);
        console.log(`Launches: ${filteredLaunches.length}, Events: ${filteredSpaceEvents.length}, Combined: ${filteredCombinedEvents.length}`);
    }

    async function fetchSpaceLaunches() {
        try {
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const formatDate = (date) => {
                return date.toISOString().split('T')[0];
            };

            const fromDate = formatDate(startDate);
            const toDate = formatDate(endDate);
            const upcomingUrl = `${API_BASE_URL}/launches/upcoming/?limit=100&net__gte=${fromDate}&net__lte=${toDate}`;
            const upcomingResponse = await fetch(upcomingUrl);

            if (!upcomingResponse.ok) {
                throw new Error(`API error: ${upcomingResponse.status}`);
            }

            const upcomingData = await upcomingResponse.json();
            console.log('Upcoming launches:', upcomingData);

            const launchEvents = upcomingData.results.map(launch => {
                const launchDate = new Date(launch.net);
                let launchType = 'OTHER';
                if (launch.mission) {
                    if (launch.mission.type) {
                        if (launch.mission.type.includes('Earth Science')) {
                            launchType = 'EARTH_OBSERVATION';
                        } else if (launch.mission.type.includes('Communication')) {
                            launchType = 'COMMUNICATION';
                        } else if (launch.mission.type.includes('Human')) {
                            launchType = 'CREWED';
                        } else if (launch.mission.type.includes('Resupply')) {
                            launchType = 'RESUPPLY';
                        }
                    }
                }
                if (launch.is_crewed) {
                    launchType = 'CREWED';
                }

                return {
                    id: launch.id,
                    title: launch.name,
                    description: launch.mission ? launch.mission.description : 'No mission description available',
                    date: launchDate,
                    location: launch.pad ? `${launch.pad.name}, ${launch.pad.location.name}` : 'Unknown location',
                    type: launchType,
                    status: launch.status.name,
                    category: 'LAUNCH',
                    rocketName: launch.rocket ? launch.rocket.configuration.name : 'Unknown rocket',
                    launchServiceProvider: launch.launch_service_provider ? launch.launch_service_provider.name : 'Unknown provider',
                    missionType: launch.mission ? launch.mission.type : 'Unknown mission type',
                };
            });

            return launchEvents;
        } catch (error) {
            console.error('Error fetching space launches:', error);
            return [];
        }
    }

    async function fetchSpaceEvents() {
        try {
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const formatDate = (date) => {
                return date.toISOString().split('T')[0];
            };

            const fromDate = formatDate(startDate);
            const toDate = formatDate(endDate);
            const eventsUrl = `${API_BASE_URL}/events/upcoming/?limit=100&date__gte=${fromDate}&date__lte=${toDate}`;
            const eventsResponse = await fetch(eventsUrl);
            if (!eventsResponse.ok) {
                throw new Error(`API error: ${eventsResponse.status}`);
            }

            const eventsData = await eventsResponse.json();
            console.log('Upcoming space events:', eventsData);
            const spaceEvents = eventsData.results.map(event => {
                let eventType = 'OTHER';
                if (event.type) {
                    const typeNameLower = event.type.name ? event.type.name.toLowerCase() : '';
                    if (typeNameLower.includes('dock') && !typeNameLower.includes('undock')) {
                        eventType = 'DOCKING';
                    } else if (typeNameLower.includes('undock')) {
                        eventType = 'UNDOCKING';
                    } else if (typeNameLower.includes('land')) {
                        eventType = 'LANDING';
                    } else if (typeNameLower.includes('eva') || typeNameLower.includes('spacewalk')) {
                        eventType = 'SPACEWALK';
                    } else if (typeNameLower.includes('flyby')) {
                        eventType = 'FLYBY';
                    }
                }

                return {
                    id: event.id,
                    title: event.name,
                    description: event.description || 'No description available',
                    date: new Date(event.date),
                    location: event.location || 'Space',
                    type: eventType,
                    status: event.status ? event.status.name : 'Unknown',
                    category: 'EVENT',
                    eventType: event.type ? event.type.name : 'Unknown event type',
                    program: event.program && event.program.length > 0 ? event.program[0].name : 'Unknown program',
                };
            });

            return spaceEvents;
        } catch (error) {
            console.error('Error fetching space events:', error);
            return [];
        }
    }

    async function updateCalendar() {
        loading.style.display = 'block';
        calendar.innerHTML = '';

        try {
            const [apiLaunches, apiEvents] = await Promise.all([
                fetchSpaceLaunches(),
                fetchSpaceEvents()
            ]);

            if (apiLaunches && apiLaunches.length > 0) {
                launches = [...apiLaunches];
                console.log('Successfully fetched API launches:', launches);
            } else {
                launches = [];
                console.log('API returned no launches');
            }

            if (apiEvents && apiEvents.length > 0) {
                spaceEvents = [...apiEvents];
                console.log('Successfully fetched API events:', spaceEvents);
            } else {
                spaceEvents = [];
                console.log('API returned no events');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            launches = [];
            spaceEvents = [];
        } finally {
            applyFilters();
            drawCalendar();
            loading.style.display = 'none';
        }
    }

    function drawCalendar() {
        console.log(`Drawing calendar - Current view: ${currentView}`);
        calendar.innerHTML = '';

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;

        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            calendar.appendChild(emptyDay);
        }

        for (let i = 1; i <= totalDays; i++) {
            const dayBox = document.createElement('div');
            dayBox.className = 'day';

            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = i;
            dayNumber.setAttribute('data-day', days[(firstDay + i - 1) % 7]);
            dayBox.appendChild(dayNumber);

            const dayEvents = filteredCombinedEvents.filter(event => {
                const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                return eventDate.getDate() === i &&
                    eventDate.getMonth() === month &&
                    eventDate.getFullYear() === year;
            });

            dayEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = `event ${event.type}`;
                const maxTitleLength = 15;
                eventElement.textContent = event.title.length > maxTitleLength ?
                    event.title.substring(0, maxTitleLength) + '...' :
                    event.title;
                eventElement.dataset.eventId = event.id;
                eventElement.addEventListener('click', () => showEventDetails(event));
                dayBox.appendChild(eventElement);
            });

            calendar.appendChild(dayBox);
        }
    }

    function showEventDetails(event) {
        document.getElementById('event-title').textContent = event.title;

        const eventDate = new Date(event.date);
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('event-date').textContent = `Date: ${eventDate.toLocaleDateString('en-US', options)}`;
        document.getElementById('event-date').style.fontFamily = "'Roboto', sans-serif";

        document.getElementById('event-description').textContent = `Description: ${event.description || 'No description available'}`;
        document.getElementById('event-description').style.fontFamily = "'Roboto', sans-serif";

        document.getElementById('event-location').textContent = `Location: ${event.location}`;
        document.getElementById('event-location').style.fontFamily = "'Roboto', sans-serif";

        document.getElementById('event-type').textContent = `Mission Type: ${event.missionType || event.type}`;
        document.getElementById('event-type').style.fontFamily = "'Roboto', sans-serif";

        const additionalDetails = document.getElementById('additional-details');
        additionalDetails.innerHTML = '';

        const detailsList = [
            { label: 'Status', value: event.status },
            { label: 'Rocket', value: event.rocketName },
            { label: 'Launch Provider', value: event.launchServiceProvider }
        ];

        detailsList.forEach(detail => {
            if (detail.value) {
                const detailElement = document.createElement('p');
                detailElement.className = 'event-detail';
                detailElement.textContent = `${detail.label}: ${detail.value}`;
                detailElement.style.fontFamily = "'Roboto', sans-serif";
                additionalDetails.appendChild(detailElement);
            }
        });

        overlay.style.display = 'block';
        eventDetails.style.display = 'block';
    }

    function closeEventDetails() {
        overlay.style.display = 'none';
        eventDetails.style.display = 'none';
    }
});