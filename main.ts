namespace SpriteKind {
    export const Checkpoint = SpriteKind.create()
}
function debug_move_camera_with_directions () {
    debug_cam = sprites.create(assets.image`pink_block`, SpriteKind.Player)
    debug_cam.setFlag(SpriteFlag.Ghost, true)
    controller.moveSprite(debug_cam, 500, 500)
    scene.cameraFollowSprite(debug_cam)
    spriteutils.placeAngleFrom(
    debug_cam,
    0,
    0,
    sprite_player
    )
}
sprites.onOverlap(SpriteKind.Player, SpriteKind.Checkpoint, function (sprite, otherSprite) {
    if (in_game) {
        if (sprites.readDataNumber(sprite, "checkpoints_got") == sprites.readDataNumber(otherSprite, "checkpoint")) {
            sprites.setDataNumber(sprite, "checkpoints_got", (sprites.readDataNumber(sprite, "checkpoints_got") + 1) % map_checkpoints_needed)
            sprites.setDataSprite(sprite, "target_checkpoint", null)
        }
    }
})
events.tileEvent(SpriteKind.Player, assets.tile`checkerflag`, events.TileEvent.StartOverlapping, function (sprite) {
    if (sprites.readDataNumber(sprite, "lap") == laps) {
        if (finished_cars.indexOf(sprite) == -1) {
            finished_cars.push(sprite)
            sprite.startEffect(effects.confetti, 1000)
            sprite.sayText("" + sprites.readDataString(sprite, "name") + ": Finished " + make_ordinal(finished_cars.length))
        }
        if (sprite_player == sprite) {
            sprites.setDataBoolean(sprite, "bot", true)
            sprites.setDataNumber(sprite, "checkpoints_got", 0)
            sprites.setDataSprite(sprite, "target_checkpoint", null)
        }
    } else {
        sprites.changeDataNumberBy(sprite, "lap", 1)
        sprite.sayText("" + sprites.readDataString(sprite, "name") + ": Lap " + sprites.readDataNumber(sprite, "lap"))
    }
})
function debug_reveal_checkpoints () {
    for (let sprite of sprites.allOfKind(SpriteKind.Checkpoint)) {
        sprite.setFlag(SpriteFlag.Invisible, false)
        sprite.sayText("" + (sprites.readDataNumber(sprite, "checkpoint") + 1) + "/" + map_checkpoints_needed)
    }
}
function define_animations () {
    car_images = [[
    assets.animation`red_car_up`,
    assets.animation`red_car_right`,
    assets.animation`red_car_down`,
    assets.animation`red_car_left`
    ]]
}
controller.up.onEvent(ControllerButtonEvent.Repeated, function () {
    if (in_game && !(sprites.readDataBoolean(sprite_player, "bot"))) {
        move_car(sprite_player, 0, car_accel)
    }
})
function define_maps () {
    maps = [tilemap`classic_loop_map`]
    maps_checkpoints_needed = [6]
    maps_starting_tile = [tilemap`classic_loop_starting_tiles`]
    maps_driving_tiles = [tilemap`classic_loop_map_driving_tiles`]
    maps_slow_tiles = [tilemap`classic_loop_map_slow_tiles`]
    maps_wall_tiles = [tilemap`classic_loop_map_wall_tiles`]
    maps_names = ["Classic loop"]
    maps_flower_seeds = [645]
    maps_background_color = [images.colorBlock(7)]
}
function get_overlapping_sprites (target: Sprite, kind: number) {
    local_sprites = []
    for (let sprite of sprites.allOfKind(kind)) {
        if (target.overlapsWith(sprite)) {
            local_sprites.push(sprite)
        }
    }
    return local_sprites
}
function prepare_map (map_select: number) {
    tiles.setCurrentTilemap(maps[map_select])
    map_driving_tiles = get_all_tiles_in_tilemap([maps_driving_tiles[map_select]])
    map_checkpoints_needed = maps_checkpoints_needed[map_select]
    map_starting_tiles = get_all_tiles_in_tilemap([maps_starting_tile[map_select]])
    map_slow_tiles = get_all_tiles_in_tilemap([maps_slow_tiles[map_select]])
    map_wall_tiles = get_all_tiles_in_tilemap([maps_wall_tiles[map_select]])
    map_name = maps_names[map_select]
    scene.setBackgroundColor(maps_background_color[map_select])
    if (maps_flower_seeds[map_select] != -1) {
        rng_flower = Random.createRNG(maps_flower_seeds[map_select])
        for (let index = 0; index < tiles.getTilesByType(assets.tile`grass`).length / 6; index++) {
            for (let tile of [sprites.castle.tileGrass1, sprites.castle.tileGrass3, sprites.castle.tileGrass2]) {
                tiles.setTileAt(rng_flower.randomElement(tiles.getTilesByType(assets.tile`grass`)), tile)
            }
        }
    }
    for (let tile of map_wall_tiles) {
        for (let location of tiles.getTilesByType(tile)) {
            tiles.setWallAt(location, true)
        }
    }
    all_checkpoint_tiles = [
    assets.tile`checkpoint_1_tile1`,
    assets.tile`checkpoint_2_tile`,
    assets.tile`checkpoint_3_tile`,
    assets.tile`checkpoint_4_tile`,
    assets.tile`checkpoint_5_tile0`,
    assets.tile`checkpoint_6_tile`
    ]
    all_checkpoints = []
    for (let index = 0; index <= map_checkpoints_needed - 1; index++) {
        these_checkpoints = []
        for (let location of tiles.getTilesByType(all_checkpoint_tiles[index])) {
            sprite_checkpoint = sprites.create(assets.image`checkpoint_sprite`, SpriteKind.Checkpoint)
            sprite_checkpoint.setFlag(SpriteFlag.Invisible, true)
            sprite_checkpoint.setFlag(SpriteFlag.GhostThroughTiles, true)
            sprite_checkpoint.setFlag(SpriteFlag.GhostThroughWalls, true)
            sprites.setDataNumber(sprite_checkpoint, "checkpoint", index)
            tiles.placeOnTile(sprite_checkpoint, location)
            tiles.setTileAt(location, map_driving_tiles[0])
            these_checkpoints.push(sprite_checkpoint)
        }
        all_checkpoints.push(these_checkpoints)
    }
    finished_cars = []
}
function wait_for_a_button_press () {
    while (!(controller.A.isPressed())) {
        pause(0)
    }
}
controller.down.onEvent(ControllerButtonEvent.Released, function () {
    if (in_game && !(sprites.readDataBoolean(sprite_player, "bot"))) {
        move_car(sprite_player, 2, 0)
    }
})
controller.right.onEvent(ControllerButtonEvent.Repeated, function () {
    if (in_game && !(sprites.readDataBoolean(sprite_player, "bot"))) {
        move_car(sprite_player, 1, car_accel)
    }
})
function move_car (car: Sprite, dir: number, accel: number) {
    if (spriteutils.isDestroyed(car)) {
        return
    }
    if (dir == 0) {
        car.ay = accel * -1
    } else if (dir == 1) {
        car.ax = accel
    } else if (dir == 2) {
        car.ay = accel
    } else {
        car.ax = accel * -1
    }
}
controller.right.onEvent(ControllerButtonEvent.Released, function () {
    if (in_game && !(sprites.readDataBoolean(sprite_player, "bot"))) {
        move_car(sprite_player, 1, 0)
    }
})
controller.left.onEvent(ControllerButtonEvent.Released, function () {
    if (in_game && !(sprites.readDataBoolean(sprite_player, "bot"))) {
        move_car(sprite_player, 3, 0)
    }
})
function start_race () {
    in_game = true
    refresh_following()
}
function wait_for_a_button_release () {
    while (controller.A.isPressed()) {
        pause(0)
    }
}
function prepare_bot (skin: number, place_on: number) {
    sprite_bot = prepare_car(skin, place_on)
    sprites.setDataBoolean(sprite_bot, "bot", true)
    sprites.setDataString(sprite_bot, "name", bot_names.removeAt(randint(0, bot_names.length - 1)))
    sprite_bot.sayText(sprites.readDataString(sprite_bot, "name"))
    return sprite_bot
}
function prepare_car (skin: number, place_on: number) {
    sprite_car = sprites.create(car_images[skin][0][0], SpriteKind.Player)
    characterAnimations.loopFrames(
    sprite_car,
    car_images[skin][0],
    100,
    characterAnimations.rule(Predicate.MovingUp)
    )
    characterAnimations.loopFrames(
    sprite_car,
    [car_images[skin][0][0]],
    100,
    characterAnimations.rule(Predicate.FacingUp, Predicate.NotMoving)
    )
    characterAnimations.loopFrames(
    sprite_car,
    car_images[skin][1],
    100,
    characterAnimations.rule(Predicate.MovingRight)
    )
    characterAnimations.loopFrames(
    sprite_car,
    [car_images[skin][1][0]],
    100,
    characterAnimations.rule(Predicate.FacingRight, Predicate.NotMoving)
    )
    characterAnimations.loopFrames(
    sprite_car,
    car_images[skin][2],
    100,
    characterAnimations.rule(Predicate.MovingDown)
    )
    characterAnimations.loopFrames(
    sprite_car,
    [car_images[skin][2][0]],
    100,
    characterAnimations.rule(Predicate.FacingDown, Predicate.NotMoving)
    )
    characterAnimations.loopFrames(
    sprite_car,
    car_images[skin][3],
    100,
    characterAnimations.rule(Predicate.MovingLeft)
    )
    characterAnimations.loopFrames(
    sprite_car,
    [car_images[skin][3][0]],
    100,
    characterAnimations.rule(Predicate.FacingLeft, Predicate.NotMoving)
    )
    tiles.placeOnRandomTile(sprite_car, map_starting_tiles[place_on + 1])
    tileUtil.replaceAllTiles(map_starting_tiles[place_on + 1], map_starting_tiles[0])
    sprites.setDataNumber(sprite_car, "lap", 0)
    sprites.setDataNumber(sprite_car, "checkpoints_got", 0)
    return sprite_car
}
controller.up.onEvent(ControllerButtonEvent.Released, function () {
    if (in_game && !(sprites.readDataBoolean(sprite_player, "bot"))) {
        move_car(sprite_player, 0, 0)
    }
})
controller.down.onEvent(ControllerButtonEvent.Repeated, function () {
    if (in_game && !(sprites.readDataBoolean(sprite_player, "bot"))) {
        move_car(sprite_player, 2, car_accel)
    }
})
function get_all_tiles_in_tilemap (tilemap_in_array: any[]) {
    local_all_tiles = []
    local_last_tilemap = tileUtil.currentTilemap()
    tiles.setCurrentTilemap(tilemap_in_array[0])
    for (let y = 0; y <= tileUtil.tilemapProperty(tileUtil.currentTilemap(), tileUtil.TilemapProperty.Rows); y++) {
        for (let x = 0; x <= tileUtil.tilemapProperty(tileUtil.currentTilemap(), tileUtil.TilemapProperty.Columns); x++) {
            if (local_all_tiles.indexOf(tiles.tileImageAtLocation(tiles.getTileLocation(x, y))) == -1) {
                local_all_tiles.push(tiles.tileImageAtLocation(tiles.getTileLocation(x, y)))
            }
        }
    }
    tiles.setCurrentTilemap(local_last_tilemap)
    local_all_tiles.pop()
    return local_all_tiles
}
function wait_for_a_button_press_and_release () {
    wait_for_a_button_press()
    wait_for_a_button_release()
}
// Only works from 0 - 10!
// 
// Used: https://stackoverflow.com/a/15810597/10291933
function make_ordinal (num: number) {
    if (num == 1) {
        return "1st"
    } else if (num == 2) {
        return "2nd"
    } else if (num == 3) {
        return "3rd"
    } else {
        return "" + num + "th"
    }
}
function debug_auto_drive () {
    sprites.setDataBoolean(sprite_player, "bot", true)
}
function refresh_following () {
    for (let sprite of sprites.allOfKind(SpriteKind.Player)) {
        if (!(sprites.readDataBoolean(sprite, "bot"))) {
            continue;
        }
        if (spriteutils.isDestroyed(sprites.readDataSprite(sprite, "target_checkpoint"))) {
            local_closest_checkpoint = all_checkpoints[sprites.readDataNumber(sprite, "checkpoints_got")][0]
            for (let sprite_checkpoint of all_checkpoints[sprites.readDataNumber(sprite, "checkpoints_got")]) {
                if (spriteutils.distanceBetween(sprite, sprite_checkpoint) < spriteutils.distanceBetween(sprite, local_closest_checkpoint)) {
                    local_closest_checkpoint = sprite_checkpoint
                }
            }
            sprites.setDataSprite(sprite, "target_checkpoint", local_closest_checkpoint)
        }
        local_last_vx = sprite.vx
        local_last_vy = sprite.vy
        spriteutils.setVelocityAtAngle(sprite, spriteutils.angleFrom(sprite, sprites.readDataSprite(sprite, "target_checkpoint")), car_accel)
        sprite.ax = sprite.vx * (car_accel * bot_steering_power)
        sprite.ay = sprite.vy * (car_accel * bot_steering_power)
        sprite.setVelocity(local_last_vx, local_last_vy)
    }
}
function debug_camera_follow_random_car () {
    sprite = sprites.allOfKind(SpriteKind.Player)._pickRandom()
    scene.cameraFollowSprite(sprite)
    sprite.setFlag(SpriteFlag.ShowPhysics, true)
}
function debug_place_tiles_in_top_right (tiles2: any[]) {
    for (let x = 0; x <= tiles2.length - 1; x++) {
        tiles.setTileAt(tiles.getTileLocation(x, 0), tiles2[x])
    }
}
function debug_show_car_physics () {
    for (let sprite of sprites.allOfKind(SpriteKind.Player)) {
        sprite.setFlag(SpriteFlag.ShowPhysics, true)
    }
}
function define_bot_names () {
    // Pulled from: https://forum.makecode.com/u?order=likes_received&period=all 
    // With users with more than 10 likes received as of 9/6/2022 (249 users)
    // 
    // JS code: (used on the page above)
    // 
    // const usernames = document.getElementsByClassName("username bold");
    // let all = "";
    // for (const e of usernames) {
    //     all += e.children[0].innerText;
    //     all += ",";
    // }
    // console.log(all);
    bot_names = "UnsignedArduino,richard,Dreadmask197,GameGod,Kat,Agent_14,jwunderl,livcheerful,DahbixLP,purna079,FlintAsher,AlexK,shakao,E-EnerG-Gamecentral,LCProCODER,omnisImperium,Lucas_M,peli,kwx,Kiwiphoenix364,UnderwaterAstronaut,cosmoscowboy,girlwhocode,Primal_Nexus,S0m3_random_guy,Colethewolf,darzu,jacob_c,MopishCobra75,AqeeAqee,ggiscool,fd268,LaserFoxPro,charliegregg,frank_schmidt,Adri314,ursoalph,mmoskal,MakeCode,CyberPulse,felixtsu,annapurna079,ThunderDrop180,TheJaky,brandodon,personalnote,NxNMatrixGL,theCobolKid,reyhanPanci256,Wanna_be_coder,edubsky,SoftTalker,Taser,GoMustangs,eanders,SCARfazewolf,SPerkins25,Segatendo,gusiscute64,Vidget,jacqueline.russell,Uggie,Purp13,EuJeen,andrew-ski,Bag3l,TZG,XDlol,Opistickz,jedgarpark,Quantum_games,Vegz78,Eden264,demoCrash,Kirito_theblacksword,ymxdj0,CarltonFade,HewwoBug,TakeTheL08,CDarius,Skitter,ractive,ThomasS,PrinceDaBezt123,marioeligi,senorlloyd,shaqattack8,ImaAngryBear,2ndClemens,Unique,shiba-jp,alex812,InvalidProject99,kirbop,Grimm,rymc88,kingcobralasersnakes,Cat10847,ChickenBoy,JRT,Eretick,hasanchik,logic_lab,MrHM,FlyingFox,Younes,timber,portalknight,Nome_muito_criativo,Gideon_loves_cats,hassan,Jabberwock,jvdos,KIKIvsIT,WeCodeMakeCode,kjw,bosnivan,Blobiy,NoValues,Local_momo,JazzyBurrito,Dylsaster,biscuit,gbraad,_nico,EgeoTube,EnteroPositivo,jmods,beepboop,Bill-0-Coding,paul,JustinXue,RarrboiMemes,WoodysWorkshop,cameron,E-EnerG-Gamecentral2,robigu444,codebott578,I_Love_HxH,stulowe80,Darkfeind,Gabriel,Kai,The_pro551,3issa,bsiever,nobita10,Sonicblaston,ChaseMor,Spinecho,Codeboy-Advanced,viny1234,IvanPoon,AussieAlpha,shaoziyang,Satisfaction,thesonicfan192,Rocket_Scion,Camaro,randomuser,drtongue96,SebT,otorp2,Redjay1011,Arielprogamer76,SAO_Me,CoolSwords4,loretod,thegreatone,squidink7,Cbomb,henrym,MinatsuT,joshmarinacci,eligaming1311,LJJames,peter,asigned_arduino,grandmadeb,cherietan,Daniel,techahoynyc,Jeanne,isaacreisbr23,jubelit,SizzleStick,DragonMountainDesign,mileswatson,Sirbull,CoolCreeper,nayrbgo,mameeewin,infchem,llNekoll,eigenjoy,CoreyZeneberg,jlj1978,KittenMaster37,Jernau,SM123456,Spacetime50,marioninja430,abchatra,cora.yang,njp,MK97-2007,salieri,NotOnefinity,Cookiecreationsyt,CuteMrMerp,KeveZeer,Napomex,mmmacademy,ArboTeach,DaEnderman,awful-coder,Galorlx,tballmsft,teachcreamer,wimberlyw,204maker,sofiania,MKleinSB,adcoding,jfo8000,Nobrain,Karlstens,Gickin,Santiago,Glitch,TailsCodingClub,Windoman,KalanTOWN,CardboardPete,GGBot,kristianpedersen,mouseart,Dace,user14,jenfoxbot,pvzsupersanicman,Josh,rossana,CharlieDeBoss12,SCAR.chris,Milo,Delta,CrownYou,dp4".split(",")
}
function prepare_player (skin: number, place_on: number) {
    sprite_player = prepare_car(skin, place_on)
    scene.cameraFollowSprite(sprite_player)
    sprites.setDataBoolean(sprite_player, "bot", false)
    sprites.setDataString(sprite_player, "name", "You")
    sprite_player.sayText(sprites.readDataString(sprite_player, "name"))
    return sprite_player
}
function make_leaderboard (items: any[], scroll_to: number) {
    menu_leaderboard = miniMenu.createMenuFromArray(items)
    for (let index = 0; index < scroll_to; index++) {
        menu_leaderboard.moveSelection(miniMenu.MoveDirection.Down)
    }
    menu_leaderboard.setDimensions(scene.screenWidth() - 8, scene.screenHeight() - 10)
    menu_leaderboard.setMenuStyleProperty(miniMenu.MenuStyleProperty.Border, 1)
    menu_leaderboard.setMenuStyleProperty(miniMenu.MenuStyleProperty.BorderColor, images.colorBlock(15))
    menu_leaderboard.setButtonEventsEnabled(false)
    menu_leaderboard.setFlag(SpriteFlag.RelativeToCamera, true)
    menu_leaderboard.setPosition(5, 6)
}
function update_car_physics (car: Sprite, drive_frict: number, slow_frict: number, drive_max_velo: number, slow_max_velo: number) {
    for (let tile of map_driving_tiles) {
        if (car.tileKindAt(TileDirection.Center, tile)) {
            car.fx = drive_frict
            car.fy = drive_frict
            car.vx = Math.constrain(car.vx, drive_max_velo * -1, drive_max_velo)
            car.vy = Math.constrain(car.vy, drive_max_velo * -1, drive_max_velo)
            return
        }
    }
    for (let tile of map_slow_tiles) {
        if (car.tileKindAt(TileDirection.Center, tile)) {
            car.fx = slow_frict
            car.fy = slow_frict
            car.vx = Math.constrain(car.vx, slow_max_velo * -1, slow_max_velo)
            car.vy = Math.constrain(car.vy, slow_max_velo * -1, slow_max_velo)
            return
        }
    }
}
controller.left.onEvent(ControllerButtonEvent.Repeated, function () {
    if (in_game && !(sprites.readDataBoolean(sprite_player, "bot"))) {
        move_car(sprite_player, 3, car_accel)
    }
})
let local_player_names: miniMenu.MenuItem[] = []
let sprite: Sprite = null
let local_last_vy = 0
let local_last_vx = 0
let local_closest_checkpoint: Sprite = null
let local_last_tilemap: tiles.TileMapData = null
let local_all_tiles: Image[] = []
let sprite_car: Sprite = null
let bot_names: string[] = []
let sprite_bot: Sprite = null
let sprite_checkpoint: Sprite = null
let these_checkpoints: Sprite[] = []
let all_checkpoints: Sprite[][] = []
let all_checkpoint_tiles: Image[] = []
let rng_flower: FastRandomBlocks = null
let map_name = ""
let map_wall_tiles: Image[] = []
let map_slow_tiles: Image[] = []
let map_starting_tiles: Image[] = []
let map_driving_tiles: Image[] = []
let local_sprites: Sprite[] = []
let maps_background_color: number[] = []
let maps_flower_seeds: number[] = []
let maps_names: string[] = []
let maps_wall_tiles: tiles.TileMapData[] = []
let maps_slow_tiles: tiles.TileMapData[] = []
let maps_driving_tiles: tiles.TileMapData[] = []
let maps_starting_tile: tiles.TileMapData[] = []
let maps_checkpoints_needed: number[] = []
let maps: tiles.TileMapData[] = []
let car_images: Image[][][] = []
let finished_cars: Sprite[] = []
let map_checkpoints_needed = 0
let sprite_player: Sprite = null
let debug_cam: Sprite = null
let sprite_321go: TextSprite = null
let menu_leaderboard: miniMenu.MenuSprite = null
let in_game = false
let laps = 0
let car_accel = 0
let bot_steering_power = 0
stats.turnStats(true)
let speed_multiplier = 1
bot_steering_power = 0.01
car_accel = speed_multiplier * 300
let car_drive_max_velo = car_accel * 0.5
let car_drive_frict = car_accel * 2
let car_slow_max_velo = car_drive_max_velo * 0.5
let car_slow_frict = car_drive_frict * 2
laps = 3
in_game = false
controller.configureRepeatEventDefaults(0, 20)
define_maps()
define_animations()
define_bot_names()
prepare_map(0)
let car_names_at_begin: miniMenu.MenuItem[] = []
for (let index = 0; index <= 7; index++) {
    car_names_at_begin.push(miniMenu.createMenuItem("---: " + sprites.readDataString(prepare_bot(0, index), "name")))
}
car_names_at_begin.push(miniMenu.createMenuItem("---: " + sprites.readDataString(prepare_player(0, 8), "name")))
make_leaderboard(car_names_at_begin, 8)
wait_for_a_button_press_and_release()
menu_leaderboard.close()
if (true) {
    sprite_321go = textsprite.create("xxxx", 1, 15)
    sprite_321go.setMaxFontHeight(10)
    sprite_321go.setBorder(1, 15, 2)
    sprite_321go.setFlag(SpriteFlag.Ghost, true)
    sprite_321go.setFlag(SpriteFlag.RelativeToCamera, true)
    sprite_321go.setPosition(scene.screenWidth() * 0.5, scene.screenHeight() * 0.2)
    for (let index = 0; index <= 2; index++) {
        sprite_321go.setText("" + (3 - index) + "...")
        pause(1000)
    }
    sprite_321go.setText("GO!!")
    start_race()
    pause(1000)
    sprite_321go.destroy()
} else {
    start_race()
}
game.onUpdate(function () {
    if (in_game) {
        for (let sprite of sprites.allOfKind(SpriteKind.Player)) {
            update_car_physics(sprite, car_drive_frict, car_slow_frict, car_drive_max_velo, car_slow_max_velo)
        }
        refresh_following()
    }
})
forever(function () {
    if (in_game) {
        if (finished_cars.length == 9) {
            pause(1000)
            local_player_names = []
            for (let index = 0; index <= finished_cars.length - 1; index++) {
                local_player_names.push(miniMenu.createMenuItem("" + make_ordinal(index + 1) + ": " + sprites.readDataString(finished_cars[index], "name")))
            }
            make_leaderboard(local_player_names, finished_cars.indexOf(sprite_player))
            wait_for_a_button_press_and_release()
            game.reset()
        }
    }
    pause(100)
})
