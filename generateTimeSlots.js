const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const DocRegister = require('./models/docRegister'); // Adjust the path if needed

async function generateTimeSlotsForAllDoctors(startDate, endDate, startTime, endTime, intervalMinutes) {
    await mongoose.connect('mongodb://localhost:27017/healingHandDB', { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        const doctors = await DocRegister.find();
        if (!doctors || doctors.length === 0) {
            throw new Error('No doctors found');
        }

        for (const doctor of doctors) {
            let slots = [];
            let currentDate = DateTime.fromISO(startDate);
            const finalDate = DateTime.fromISO(endDate);

            while (currentDate <= finalDate) {
                // Check if time slots for the current date already exist
                const existingSlots = doctor.availableSlots.some(slot => slot.date === currentDate.toISODate());

                if (!existingSlots) {
                    let currentStartTime = currentDate.set({ hour: startTime.hour, minute: startTime.minute });
                    const currentEndTime = currentDate.set({ hour: endTime.hour, minute: endTime.minute });

                    while (currentStartTime < currentEndTime) {
                        const slotEndTime = currentStartTime.plus({ minutes: intervalMinutes });
                        if (slotEndTime <= currentEndTime) {
                            slots.push({
                                date: currentStartTime.toISODate(),
                                startTime: currentStartTime.toISOTime({ suppressMilliseconds: true }),
                                endTime: slotEndTime.toISOTime({ suppressMilliseconds: true }),
                                isAvailable: true
                            });
                        }
                        currentStartTime = slotEndTime;
                    }
                }

                currentDate = currentDate.plus({ days: 1 });
            }

            if (slots.length > 0) {
                doctor.availableSlots.push(...slots);
                await doctor.save();
            }
        }

        console.log('Time slots generated successfully for all doctors');
    } catch (err) {
        console.error('Error generating time slots for all doctors:', err);
    } finally {
        await mongoose.disconnect();
    }
}

// Example usage
const startDate = '2024-07-17';
const endDate = '2024-07-21';
const startTime = { hour: 9, minute: 0 };
const endTime = { hour: 17, minute: 0 };
const intervalMinutes = 30;

generateTimeSlotsForAllDoctors(startDate, endDate, startTime, endTime, intervalMinutes);

//TODO: lunch break