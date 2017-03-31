var constants = {
	PLAY_REPLACE:0,
	PLAY_REMOVE:-1,
	PLAY_ADD:1,
	PLAY_FINISH:2
};

if (typeof module === "object" && module && typeof module.exports === "object") {
	module.exports = constants;
}
