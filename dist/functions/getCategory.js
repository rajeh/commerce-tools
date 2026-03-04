async function getCategory(categoryId) {
    try {
        const response = await fetch(`/api/categories/${categoryId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch category: ${response.statusText}`);
        }
        const category = await response.json();
        return category;
    } catch (error) {
        console.error('Error fetching category:', error);
        throw error;
    }
}

module.exports = getCategory;