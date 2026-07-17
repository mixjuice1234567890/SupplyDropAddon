import { world, system, ItemStack } from "@minecraft/server";

// =============================
// Supply Drop 設定
// =============================

// ON / OFF
let supplyDropEnabled = true;

// 落下間隔（10分）
let dropInterval = 20 * 60 * 10;

// 投下範囲
let dropRange = {
    minX: -2000,
    maxX: 2000,
    minZ: -2000,
    maxZ: 2000
};


// =============================
// 起動メッセージ
// =============================

world.afterEvents.worldInitialize.subscribe(() => {
    console.log("Supply Drop Addon Loaded");
});


// =============================
// 補給物資タイマー
// =============================

system.runInterval(() => {

    if (!supplyDropEnabled) {
        return;
    }

    startSupplyDrop();

}, dropInterval);


// =============================
// 補給物資生成
// =============================

function createSupplyDrop() {

    let location = getDropLocation();

let x = location.x;
let z = location.z;


    console.log(
        `Supply Drop Spawn ${x} ${z}`
    );

}
// =============================
// 落下地点決定システム
// =============================

function getDropLocation() {

    let players = world.getAllPlayers();

    let x;
    let z;

    let safe = false;


    while (!safe) {

        x = Math.floor(
            Math.random() *
            (dropRange.maxX - dropRange.minX)
        ) + dropRange.minX;


        z = Math.floor(
            Math.random() *
            (dropRange.maxZ - dropRange.minZ)
        ) + dropRange.minZ;


        safe = true;


        // プレイヤーから150ブロック以内は禁止
        for (const player of players) {

            let dx = player.location.x - x;
            let dz = player.location.z - z;


            let distance =
                Math.sqrt(
                    dx * dx +
                    dz * dz
                );


            if (distance < 150) {
                safe = false;
                break;
            }
        }
    }


    return {
        x: x,
        z: z
    };
}
// =============================
// 補給物資落下開始
// =============================

function startSupplyDrop() {

    let location = getDropLocation();

    let x = location.x;
    let z = location.z;


    // 全プレイヤーへ通知（Y座標なし）
    for (const player of world.getAllPlayers()) {

        player.sendMessage(
            `§a補給物資が投下されました！ X:${Math.floor(x)} Z:${Math.floor(z)}`
        );

    }


    // 仮の落下開始地点
    let dropY = 200;


    console.log(
        `Drop Start X:${x} Z:${z} Y:${dropY}`
    );

    // 補給物資を生成
    spawnSupplyEntity(x, dropY, z);
    return {
        x:x,
        y:dropY,
        z:z
    };

}
// =============================
// 補給物資エンティティ生成
// =============================

function spawnSupplyEntity(x, y, z) {

    const dimension =
        world.getDimension("overworld");


    let entity =
        dimension.spawnEntity(
            "minecraft:chest_minecart",
            {
                x:x,
                y:y,
                z:z
            }
        );


    entity.addTag("supply_drop");


    console.log(
        "Supply entity created"
    );

}
// =============================
// 補給物資トロッコ生成
// =============================

function spawnSupplyEntity(x, y, z) {

    const dimension = world.getDimension("overworld");


    let minecart =
        dimension.spawnEntity(
            "minecraft:chest_minecart",
            {
                x: x,
                y: y,
                z: z
            }
        );


    // 補給物資用タグ
    minecart.addTag("supply_drop");


    // レア度を保存する準備
    let rarity = getRarity();

minecart.addTag(rarity);


createRarityEffect(
    minecart,
    rarity
);

    console.log(
        `Supply Drop Minecart Spawned X:${x} Y:${y} Z:${z}`
    );


startFalling(minecart);

registerSupply(minecart);
}
// =============================
// 補給物資 落下処理
// =============================

let fallingDrops = [];


function startFalling(entity) {

    fallingDrops.push({
        entity: entity,
        speed: 0.3
    });

}


// 20tickごとに落下処理
system.runInterval(() => {


    for (let i = fallingDrops.length - 1; i >= 0; i--) {


        let drop = fallingDrops[i];


        try {

            let loc = drop.entity.location;


            // 少しずつ下降
            drop.entity.teleport({
                x: loc.x,
                y: loc.y - drop.speed,
                z: loc.z
            });


            // 地面についたら停止
            if (loc.y <= 5) {

                fallingDrops.splice(i, 1);

                console.log(
                    "Supply Drop Landed"
                );

            }


        } catch {

            // 消えた場合削除
            fallingDrops.splice(i, 1);

        }

    }


}, 20);
// =============================
// レア度抽選
// =============================

function getRarity() {

    let random =
        Math.random() * 100;


    if (random < 1) {

        return "SSR";

    } else if (random < 10) {

        return "SR";

    } else if (random < 35) {

        return "R";

    } else {

        return "N";

    }

}
// =============================
// ビーコン風エフェクト
// =============================

function createRarityEffect(entity, rarity) {


    let particle;


    switch(rarity){


        case "SSR":

            particle =
            "minecraft:mobspell_emitter";

            break;


        case "SR":

            particle =
            "minecraft:blue_flame_particle";

            break;


        case "R":

            particle =
            "minecraft:happy_villager";

            break;


        default:

            particle =
            "minecraft:basic_flame_particle";

            break;

    }



    system.runInterval(()=>{


        try{


            let pos =
            entity.location;


            for(let y=0;y<10;y++){


                entity.dimension.spawnParticle(
                    particle,
                    {
                        x:pos.x,
                        y:pos.y+y,
                        z:pos.z
                    }
                );


            }


        }catch{

        }


    },20);


}


    system.runInterval(() => {


        try {


            let pos = entity.location;


            entity.dimension.spawnParticle(
                particle,
                {
                    x: pos.x,
                    y: pos.y + 1,
                    z: pos.z
                }
            );


        } catch {

        }


    }, 10);


// =============================
// 補給物資管理
// =============================

let supplyChests = [];


function registerSupply(entity) {

    supplyChests.push({
        entity: entity,
        landed: false
    });

}


// 補給物資チェック
system.runInterval(() => {


    for (let i = supplyChests.length - 1; i >= 0; i--) {


        let supply = supplyChests[i];


        try {


            let entity = supply.entity;


            let y = entity.location.y;


            // 地面到着
            if (y <= 5 && !supply.landed) {


                supply.landed = true;


                console.log(
                    "Supply Drop Landed!"
                );

let rarity = entity.getTags()[0];

createSupplyChest(
    entity.location.x,
    entity.location.y,
    entity.location.z,
    rarity
);


                // 次回ここでアイテム投入


            }


        } catch {


            supplyChests.splice(i, 1);

        }

    }


}, 20);
// =============================
// アイテム追加システム
// =============================

// =============================
// 補給チェスト生成
// =============================

function createSupplyChest(x, y, z, rarity) {

    let dimension = world.getDimension("overworld");


    let block = dimension.getBlock({
        x: Math.floor(x),
        y: Math.floor(y),
        z: Math.floor(z)
    });


    block.setType("minecraft:chest");


    let chest =
        dimension.getBlock({
            x: Math.floor(x),
            y: Math.floor(y),
            z: Math.floor(z)
        });


    let container =
        chest.getComponent("inventory").container;


    fillSupplyChest(
        container,
        rarity
    );


    console.log(
        "Supply Chest Created"
    );

}
// =============================
// 補給チェスト中身
// =============================

function fillSupplyChest(container, rarity) {


    if (rarity === "N") {

        fillNormal(container);

    }
if (rarity === "R") {

    fillRare(container);

}

if (rarity === "SR") {

    fillSuperRare(container);

}

if (rarity === "SSR") {

    fillSuperSuperRare(container);

}

}


// =============================
// Nランク
// =============================

function fillNormal(container) {


    // 鉄ブロック 3〜5
    addItem(
        container,
        "minecraft:iron_block",
        randomAmount(3,5)
    );


    // 金ブロック 1〜3
    addItem(
        container,
        "minecraft:gold_block",
        randomAmount(1,3)
    );


    // 石炭ブロック 3〜5
    addItem(
        container,
        "minecraft:coal_block",
        randomAmount(3,5)
    );


    // 火薬 10〜30
    addItem(
        container,
        "minecraft:gunpowder",
        randomAmount(10,30)
    );


    // ステーキ 10〜20
    addItem(
        container,
        "minecraft:cooked_beef",
        randomAmount(10,20)
    );


    // 紙 20〜50
    addItem(
        container,
        "minecraft:paper",
        randomAmount(20,50)
    );


    // 矢（50%）
    if (Math.random() < 0.5) {

        addItem(
            container,
            "minecraft:arrow",
            randomAmount(64,128)
        );

    }


    // 銅（50%）
    if (Math.random() < 0.5) {

        addItem(
            container,
            "minecraft:copper_ingot",
            randomAmount(32,64)
        );

    }

}// =============================
// ランダム数
// =============================

function randomAmount(min,max){

    return Math.floor(
        Math.random()*(max-min+1)
    )+min;

}// =============================
// 正式アイテム追加
// =============================

function addItem(container, itemId, amount) {

    try {

        const item =
            new ItemStack(
                itemId,
                amount
            );


        container.addItem(item);


    } catch(e) {

        console.log(
            "Item Error : " + itemId
        );

    }

}
// =============================
// Rランク
// =============================

function fillRare(container) {

    addRandomDiamondTool(container);

    // 鉄ブロック 6〜10
    addItem(
        container,
        "minecraft:iron_block",
        randomAmount(6,10)
    );


    // 金ブロック 3〜6
    addItem(
        container,
        "minecraft:gold_block",
        randomAmount(3,6)
    );


    // 石炭ブロック 6〜10
    addItem(
        container,
        "minecraft:coal_block",
        randomAmount(6,10)
    );


    // 火薬 30〜64
    addItem(
        container,
        "minecraft:gunpowder",
        randomAmount(30,64)
    );


    // 土 1スタック
    addItem(
        container,
        "minecraft:dirt",
        64
    );


    // ステーキ 30〜64
    addItem(
        container,
        "minecraft:cooked_beef",
        randomAmount(30,64)
    );


    // 矢2スタック
    addItem(
        container,
        "minecraft:arrow",
        128
    );


    // ケーキ 50%
    if(Math.random() < 0.5){

        addItem(
            container,
            "minecraft:cake",
            randomAmount(1,2)
        );

    }


    // レッドストーンブロック 50%
    if(Math.random() < 0.5){

        addItem(
            container,
            "minecraft:redstone_block",
            5
        );

    }


    // 銅 50%
    if(Math.random() < 0.5){

        addItem(
            container,
            "minecraft:copper_ingot",
            randomAmount(64,128)
        );

    }

}
// =============================
// ダイヤツール抽選
// =============================

function addRandomDiamondTool(container){


    let tools = [

        "minecraft:diamond_sword",

        "minecraft:diamond_pickaxe",

        "minecraft:diamond_axe",

        "minecraft:diamond_shovel",

        "minecraft:diamond_hoe"

    ];


    let tool =
        tools[
            Math.floor(
                Math.random()*tools.length
            )
        ];


    addItem(
        container,
        tool,
        1
    );

}
// =============================
// SRランク
// =============================

function fillSuperRare(container){


    // ダイヤピッケル確定
    addItem(
        container,
        "minecraft:diamond_pickaxe",
        1
    );


    // ダイヤ装備どれか
    addRandomDiamondArmor(container);


    // 鉄ブロック
    addItem(
        container,
        "minecraft:iron_block",
        randomAmount(10,15)
    );


    // 金ブロック
    addItem(
        container,
        "minecraft:gold_block",
        randomAmount(6,10)
    );


    // 金リンゴ
    addItem(
        container,
        "minecraft:golden_apple",
        randomAmount(1,3)
    );


    // 赤石ブロック
    addItem(
        container,
        "minecraft:redstone_block",
        randomAmount(6,10)
    );


    // 火薬 2〜3スタック
    addItem(
        container,
        "minecraft:gunpowder",
        randomAmount(128,192)
    );


    // ステーキ
    addItem(
        container,
        "minecraft:cooked_beef",
        randomAmount(64,128)
    );


    // 矢 50%
    if(Math.random()<0.5){

        addItem(
            container,
            "minecraft:arrow",
            192
        );

    }


    // エンチャント本 50%
    if(Math.random()<0.5){

        addItem(
            container,
            "minecraft:enchanted_book",
            1
        );

    }


    // エンチャ金リンゴ 30%
    if(Math.random()<0.3){

        addItem(
            container,
            "minecraft:enchanted_golden_apple",
            1
        );

    }


    // ダイヤ 40%
    if(Math.random()<0.4){

        addItem(
            container,
            "minecraft:diamond",
            randomAmount(1,5)
        );

    }


    // ネザライトアップグレード 30%
    if(Math.random()<0.3){

        addItem(
            container,
            "minecraft:netherite_upgrade_smithing_template",
            5
        );

    }

}
// =============================
// ダイヤ装備抽選
// =============================

function addRandomDiamondArmor(container){


    let armor = [

        "minecraft:diamond_helmet",

        "minecraft:diamond_chestplate",

        "minecraft:diamond_leggings",

        "minecraft:diamond_boots"

    ];


    let item =
        armor[
            Math.floor(
                Math.random()*armor.length
            )
        ];


    addItem(
        container,
        item,
        1
    );

}
// =============================
// SSRランク
// =============================

function fillSuperSuperRare(container){


    // ダイヤフル
    addItem(container,"minecraft:diamond_helmet",1);
    addItem(container,"minecraft:diamond_chestplate",1);
    addItem(container,"minecraft:diamond_leggings",1);
    addItem(container,"minecraft:diamond_boots",1);


    // 鉄ブロック 30〜64
    addItem(
        container,
        "minecraft:iron_block",
        randomAmount(30,64)
    );


    // 金ブロック 10〜64
    addItem(
        container,
        "minecraft:gold_block",
        randomAmount(10,64)
    );


    // ダイヤブロック
    addItem(
        container,
        "minecraft:diamond_block",
        randomAmount(1,2)
    );


    // 火薬 3〜5スタック
    addItem(
        container,
        "minecraft:gunpowder",
        randomAmount(192,320)
    );


    // エンチャント金リンゴ
    addItem(
        container,
        "minecraft:enchanted_golden_apple",
        randomAmount(3,5)
    );


    // 矢2スタック
    addItem(
        container,
        "minecraft:arrow",
        128
    );


    // エンチャント本
    addItem(
        container,
        "minecraft:enchanted_book",
        1
    );


    // 毒ポーション 50%
    if(Math.random()<0.5){

        addItem(
            container,
            "minecraft:potion",
            1
        );

    }


    // ネザライトブロック 20%
    if(Math.random()<0.2){

        addItem(
            container,
            "minecraft:netherite_block",
            1
        );

    }


    // ネザライトアップグレード
    if(Math.random()<0.5){

        addItem(
            container,
            "minecraft:netherite_upgrade_smithing_template",
            randomAmount(5,10)
        );

    }

}
// =============================
// ON OFF コマンド
// =============================

world.afterEvents.scriptEventReceive.subscribe((event)=>{


    if(event.id === "supply:on"){

        supplyDropEnabled = true;


        event.sourceEntity?.sendMessage(
            "§a補給物資 ON"
        );

    }



    if(event.id === "supply:off"){

        supplyDropEnabled = false;


        event.sourceEntity?.sendMessage(
            "§c補給物資 OFF"
        );

    }


});
// =============================
// 空チェスト削除
// =============================

system.runInterval(()=>{


    for(let supply of supplyChests){


        try{


            if(!supply.landed){
                continue;
            }


            let pos =
            supply.entity.location;


            let block =
            world
            .getDimension("overworld")
            .getBlock({
                x:Math.floor(pos.x),
                y:Math.floor(pos.y),
                z:Math.floor(pos.z)
            });



            if(
                block &&
                block.typeId === "minecraft:chest"
            ){


                let inv =
                block.getComponent("inventory")
                .container;



                if(inv.emptySlotsCount === inv.size){


                    block.setType(
                        "minecraft:air"
                    );


                    supply.entity.remove();


                }

            }


        }catch{

        }

    }


},40);
// =============================
// 落下中 無敵処理
// =============================

system.runInterval(()=>{


    for(let drop of fallingDrops){


        try{


            if(drop.entity){


                drop.entity.addEffect(
                    "resistance",
                    40,
                    {
                        amplifier:255,
                        showParticles:false
                    }
                );


            }


        }catch{

        }

    }


},20);
// =============================
// 範囲変更コマンド
// =============================

world.afterEvents.scriptEventReceive.subscribe((event)=>{


    let msg = event.message;


    if(event.id === "supply:range"){


        let size =
        Number(msg);



        if(!isNaN(size)){


            dropRange.minX = -size;
            dropRange.maxX = size;

            dropRange.minZ = -size;
            dropRange.maxZ = size;



            event.sourceEntity?.sendMessage(
                `§a補給範囲変更 X/Z ±${size}`
            );


        }

    }


});
