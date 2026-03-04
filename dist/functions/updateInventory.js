const CUSTOMER_QUERY = `
    query GetCustomerByEmail($email: String!) {
        customers(where: "email = \"${email}\"") {
            results {
                id
                email
                firstName
                lastName
                addresses {
                    id
                    firstName
                    lastName
                    streetName
                    streetNumber
                    postalCode
                    city
                    country
                    phone
                }
                defaultBillingAddressId
                defaultShippingAddressId
                phone
                carts {
                    total
                    count
                }
                orders {
                    total
                    count
                    results {
                        id
                        orderNumber
                        createdAt
                        totalPrice {
                            centAmount
                            currencyCode
                        }
                    }
                }
            }
        }
    }
`;

module.exports = { CUSTOMER_QUERY };