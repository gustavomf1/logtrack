"""
PlatformIO post-build step: merge bootloader + partition table + app into a
single flash image at their real offsets, so Wokwi flashes the *actual*
partition table our firmware was built with (default.csv, with a `spiffs`
partition) instead of falling back to its own default layout — which is why
LittleFS.begin() was failing with "File system is not mounted" in the
simulator even though the app itself booted fine.
"""

Import("env")


def merge_bin(source, target, env):
    build_dir = env.subst("$BUILD_DIR")
    bootloader = f"{build_dir}/bootloader.bin"
    partitions = f"{build_dir}/partitions.bin"
    firmware = f"{build_dir}/firmware.bin"
    merged = f"{build_dir}/wokwi-firmware.bin"

    esptool = env.subst("$PYTHONEXE") + ' "' + env.PioPlatform().get_package_dir(
        "tool-esptoolpy"
    ) + '/esptool.py"'

    env.Execute(
        f'{esptool} --chip esp32 merge_bin -o "{merged}" '
        f'0x1000 "{bootloader}" 0x8000 "{partitions}" 0x10000 "{firmware}"'
    )


env.AddPostAction("$BUILD_DIR/${PROGNAME}.bin", merge_bin)
