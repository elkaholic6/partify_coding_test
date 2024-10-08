/**
 * Fetchs the dataset from csv and populates the dropdowns with correct information.  
 * This is designed to be dynamic and scalable, allowing Partify to add data to the csv file and have it reflected on the front end
 */
fetch('dataset.csv')
    .then(response => response.text())
    .then(data => {
        Papa.parse(data, {
            header: true,
            complete: function(results) {
                const individual_data = results.data;

                const yearDropdown = document.getElementById('yearDropdown');
                const makeDropdown = document.getElementById('makeDropdown');
                const modelDropdown = document.getElementById('modelDropdown');
                const productDropdown = document.getElementById('productDropdown');
                const browseAllLink = document.getElementById('browseAll');

                let selectedYear;
                let selectedMake;
                let selectedModel;
                let selectedProduct;

                const yearSet = new Set();
                individual_data.forEach((row) => {
                    if(row['Year']) {
                        yearSet.add(row['Year']);
                    };
                });
                const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
                populateDropdown(yearDropdown, sortedYears);

                yearDropdown.addEventListener('change', () => {
                    selectedYear = yearDropdown.value;
                    if(selectedYear !== 'Select Year') {
                        makeDropdown.disabled = false;

                        makeDropdown.innerHTML = '<option>Select Make</option>';
                        const makesForYear = getUniqueMakesForYear(individual_data, selectedYear);
                        populateDropdown(makeDropdown, makesForYear);

                        modelDropdown.value = 'Select Model';
                        modelDropdown.disabled = true;
                        productDropdown.disabled = true;
                        browseAllLink.classList.add('disabled-link');
                    } else {
                        makeDropdown.disabled = true;
                        makeDropdown.innerHTML = '<option>Select Make</option>';

                        modelDropdown.value = 'Select Model';
                        modelDropdown.disabled = true;
                        productDropdown.disabled = true;

                        browseAllLink.classList.add('disabled-link');
                    }
                });

                makeDropdown.addEventListener('change', () => {
                    selectedMake = makeDropdown.value;
                    if(selectedMake !== 'Select Make') {
                        modelDropdown.disabled = false;
                        modelDropdown.innerHTML = '<option>Select Model</option>';
                        const modelsForMake = getUniqueModelsForMake(individual_data, selectedYear, selectedMake);
                        populateDropdown(modelDropdown, modelsForMake);
                    } else {
                        modelDropdown.disabled = true;
                        modelDropdown.innerHTML = '<option>Select Model</option>';
                    }
                });

                modelDropdown.addEventListener('change', () => {
                    let unfilteredLink;
                    selectedModel = modelDropdown.value;
                    if(selectedModel !== 'Select Model') {
                        unfilteredLink = getUnfilteredModelLink(individual_data, selectedYear, selectedMake, selectedModel);
                        productDropdown.disabled = false;
                        browseAllLink.href = unfilteredLink;
                        browseAllLink.classList.remove('disabled-link');
                        productDropdown.innerHTML = '<option>Select Product Type</option>';
                        const productsForModel = getUniqueProductsForModel(individual_data, selectedYear, selectedMake, selectedModel);
                        populateDropdown(productDropdown, productsForModel);
                    } else {
                        productDropdown.disabled = true;
                        productDropdown.innerHTML = '<option>Select Product Type</option>';
                        browseAllLink.href = "#";
                        browseAllLink.classList.add('disabled-link');
                    }
                });

                productDropdown.addEventListener('change', () => {
                    selectedProduct = productDropdown.value;
                    console.log('selectedProduct', selectedProduct);
                    if(selectedProduct !== 'Select Product Type') {
                        browseAllLink.classList.add('disabled-link');
                        const url = getUrlForProductType(individual_data, selectedYear, selectedMake, selectedModel, selectedProduct);
                        if (url) {
                            window.location.href = url;
                        }
                    }
                });
            }
        });
    })
    .catch(error => console.error('Error fetching the CSV file:', error));


/**
 * Populates the corresponding dropdown with only necessary items
 * @param dropdown -- the dropdown element
 * @param items -- the array of items that correlates to particular dropdown element
 */
function populateDropdown(dropdown, items) {
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.text = item;
        dropdown.add(option);
    });
}


/**
 * Returns unique makes for a given year
 * @param data -- the dataset
 * @param year -- the year
 * @returns {Array} -- the unique makes for a given year
 */

function getUniqueMakesForYear(data, year) {
    const makeSet = new Set();
    data.forEach((row) => {
        if(row['Year'] === year) {
            makeSet.add(row['Make']);
        };
    });
    console.log('makeSet', makeSet);
    return Array.from(makeSet).sort();
}


/**
 * Returns unique models for a given year and make
 * @param data -- the dataset
 * @param year -- the year
 * @param make -- the make
 * @returns {Array} -- the unique models for a given year and make
 */
function getUniqueModelsForMake(data, year, make) {
    const modelSet = new Set();
    data.forEach((row) => {
        if(row['Make'] === make && row['Year'] === year) {
            modelSet.add(row['Model']);
        };
    });
    console.log('modelSet', modelSet);
    return Array.from(modelSet).sort();
}


/**
 * Returns unique products for a given year, make, and model
 * @param data -- the dataset
 * @param year -- the year
 * @param make -- the make
 * @param model -- the model
 * @returns {Array} -- the unique products for a given year, make, and model
 */
function getUniqueProductsForModel(data, year, make, model) {
    const productSet = new Set();
    data.forEach(row => {
        if(row['Model'] === model && row['Make'] === make && row['Year'] === year) {
            productSet.add(row['Product Type']);
        }
    });
    console.log('productSet', productSet);
    return Array.from(productSet).sort();
}


/**
 * Returns the unfiltered model link.  Used if a user doesn't want to filter a particular part but would rather browse all products for that year, make, and model
 * @param data -- the dataset
 * @param year -- the year
 * @param make -- the make
 * @param model -- the model
 * @returns {string} -- the unfiltered model link
 */
function getUnfilteredModelLink(data, year, make, model) {
    let url;
    let unfilteredUrl;
    data.forEach(row => {
        if(row['Model'] === model && row['Make'] === make && row['Year'] === year) {
            url = row['URL'];
            unfilteredUrl = url.replace(/\/[^\/]*$/, '/');
        }
    });
    return unfilteredUrl;
}


/**
 * Returns the url for a particular product type
 * @param data -- the dataset
 * @param year -- the year
 * @param make -- the make
 * @param model -- the model
 * @param productType -- the product type
 * @returns {string} -- the url for a particular product type
 */
function getUrlForProductType(data, year, make, model,productType) {
    let url;
    data.forEach(row => {
        if(row['Product Type'] === productType && row['Model'] === model && row['Make'] === make && row['Year'] === year) {
            url = row['URL'];
        }
    });
    return url;
}