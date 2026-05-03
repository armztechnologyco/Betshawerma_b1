import { setGlobalOptions } from "firebase-functions";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

/**
 * Sync inventory when a new order is placed
 */
export const syncInventoryOnOrder = onDocumentCreated("orders/{orderId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    
    const order = snapshot.data();
    const items = order.items || [];
    
    logger.info(`Processing order ${event.params.orderId} for inventory deduction`);

    const batch = db.batch();
    
    for (const item of items) {
        if (item.weightInKg && item.weightInKg > 0) {
            const consumedAmount = item.weightInKg * item.quantity;
            
            // Map the item to an inventory key (matching frontend logic)
            let inventoryKey = "";
            if (item.linkedInventoryItem) {
                inventoryKey = item.linkedInventoryItem;
            } else if (item.name.toLowerCase().includes('chicken')) {
                inventoryKey = 'Chicken Meat';
            } else if (item.name.toLowerCase().includes('beef')) {
                inventoryKey = 'Beef Meat';
            } else if (item.name.toLowerCase().includes('meat')) {
                inventoryKey = 'Meat';
            }

            if (inventoryKey) {
                const invRef = db.collection('inventory').doc(inventoryKey.toLowerCase().replace(/\s+/g, '_'));
                batch.set(invRef, {
                    name: inventoryKey,
                    currentStock: admin.firestore.FieldValue.increment(-consumedAmount),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        }
    }

    try {
        await batch.commit();
        logger.info(`Inventory deducted for order ${event.params.orderId}`);
    } catch (error) {
        logger.error(`Failed to deduct inventory for order ${event.params.orderId}`, error);
    }
});

/**
 * Sync inventory when a new purchase is recorded
 */
export const syncInventoryOnPurchase = onDocumentCreated("purchases/{purchaseId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const purchase = snapshot.data();
    const itemName = purchase.itemName;
    const quantity = parseFloat(purchase.quantity);

    if (!itemName || isNaN(quantity)) return;

    logger.info(`Processing purchase ${event.params.purchaseId} for inventory addition: ${itemName}`);

    const invRef = db.collection('inventory').doc(itemName.toLowerCase().replace(/\s+/g, '_'));

    try {
        await invRef.set({
            name: itemName,
            currentStock: admin.firestore.FieldValue.increment(quantity),
            unit: purchase.unit || 'kg',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        logger.info(`Inventory updated for purchase ${itemName}`);
    } catch (error) {
        logger.error(`Failed to update inventory for purchase ${itemName}`, error);
    }
});

/**
 * Clean up inventory if a purchase is deleted
 */
export const cleanupInventoryOnPurchaseDelete = onDocumentDeleted("purchases/{purchaseId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const purchase = snapshot.data();
    const itemName = purchase.itemName;
    const quantity = parseFloat(purchase.quantity);

    if (!itemName || isNaN(quantity)) return;

    const invRef = db.collection('inventory').doc(itemName.toLowerCase().replace(/\s+/g, '_'));

    try {
        await invRef.update({
            currentStock: admin.firestore.FieldValue.increment(-quantity),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.info(`Inventory adjusted after purchase deletion: ${itemName}`);
    } catch (error) {
        logger.error(`Failed to adjust inventory after purchase deletion: ${itemName}`, error);
    }
});

/**
 * Recalculate full inventory from history (Admin Only)
 * Use this to bootstrap the 'currentStock' values
 */
export const recalculateInventory = onRequest({ cors: true }, async (req: any, res: any) => {
    try {
        logger.info("Starting full inventory recalculation...");
        
        const [purchasesSnap, ordersSnap] = await Promise.all([
            db.collection('purchases').get(),
            db.collection('orders').get()
        ]);

        const stockMap: { [key: string]: { name: string, stock: number, unit: string } } = {};

        // 1. Add all purchases
        purchasesSnap.forEach(doc => {
            const p = doc.data();
            const key = p.itemName.toLowerCase().replace(/\s+/g, '_');
            if (!stockMap[key]) {
                stockMap[key] = { name: p.itemName, stock: 0, unit: p.unit || 'kg' };
            }
            stockMap[key].stock += parseFloat(p.quantity || 0);
        });

        // 2. Subtract all order consumption
        ordersSnap.forEach(doc => {
            const order = doc.data();
            (order.items || []).forEach((item: any) => {
                if (item.weightInKg && item.weightInKg > 0) {
                    const consumed = item.weightInKg * item.quantity;
                    let inventoryKey = "";
                    if (item.linkedInventoryItem) {
                        inventoryKey = item.linkedInventoryItem;
                    } else if (item.name.toLowerCase().includes('chicken')) {
                        inventoryKey = 'Chicken Meat';
                    } else if (item.name.toLowerCase().includes('beef')) {
                        inventoryKey = 'Beef Meat';
                    } else if (item.name.toLowerCase().includes('meat')) {
                        inventoryKey = 'Meat';
                    }

                    if (inventoryKey) {
                        const key = inventoryKey.toLowerCase().replace(/\s+/g, '_');
                        if (!stockMap[key]) {
                            stockMap[key] = { name: inventoryKey, stock: 0, unit: 'kg' };
                        }
                        stockMap[key].stock -= consumed;
                    }
                }
            });
        });

        // 3. Write back to Firestore
        const batch = db.batch();
        Object.keys(stockMap).forEach(key => {
            const ref = db.collection('inventory').doc(key);
            batch.set(ref, {
                name: stockMap[key].name,
                currentStock: stockMap[key].stock,
                unit: stockMap[key].unit,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                recalculatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        await batch.commit();
        res.json({ success: true, message: "Inventory recalculated successfully", items: Object.keys(stockMap).length });
    } catch (error: any) {
        logger.error("Recalculation failed", error);
        res.status(500).send(error.message);
    }
});



