const sheets = require('../config/googleServiceAccount');
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SHEET_NAME;

const getMonth = async (req, res) => {
    try {
        const range = `${sheetName}!F2:F`;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = response.data.values;

        if (!values || values.length === 0) {
            return res.status(404).json({ message: 'No data found' });
        }

        const months = [...new Set(values.map(row => row[0]))];

        const monthOrder = [
            "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December"
        ];

        const sortedMonths = months.sort((a, b) => {
            return monthOrder.indexOf(a) - monthOrder.indexOf(b);
        });

        res.status(200).json({
            status: 'success',
            data: sortedMonths
        });

    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};
const getAction = async (req, res) => {
    try {
        const range = `${sheetName}!J2:J`;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = response.data.values;

        if (!values || values.length === 0) {
            return res.status(404).json({ message: 'No data found' });
        }

        const actions = [...new Set(values.map(row => row[0]))];

        const actionOrder = [
            "Optim Site", "Install Easymacro", "Install MassiveMIMO", "Install CMON", "Install Combat", "Install Repeater", 
            "Add Sector", "Add New NE"
        ];

        const sortedAction = actions.sort((a, b) => {
            return actionOrder.indexOf(a) - actionOrder.indexOf(b);
        });

        res.status(200).json({
            status: 'success',
            data: sortedAction
        });

    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};
const getCategory = async (req, res) => {
    try {
        const range = `${sheetName}!K2:K`;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = response.data.values;

        if (!values || values.length === 0) {
            return res.status(404).json({ message: 'No data found' });
        }

        const events = [...new Set(values.map(row => row[0]))];

        const eventOrder = [
            "Local", "VIP Event", "International", "Enterprise", "Internal"
        ];

        const sortedEvent = events.sort((a, b) => {
            return eventOrder.indexOf(a) - eventOrder.indexOf(b);
        });

        res.status(200).json({
            status: 'success',
            data: sortedEvent
        });

    } catch (error) {
        res.status(500).send('Error fetching data from Google Sheets');
    }
};

module.exports = { getMonth, getAction, getCategory };
