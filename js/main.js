$(document).ready(function() {
   $('#slider-id').liquidSlider({
    autoSlide:false,
    autoHeight:false
  });

}); 

var scrollPos = 0;
$.scrollTo(0, 0);


window.onscroll = function (oEvent) {
  // called when the window is scrolled.
  scrollPos = $(document).scrollTop();
  $('.scrollPos').text(scrollPos);
}

function goto(location) {
	$.scrollTo(location, 2000);
}

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
// THREE.JS
////////////////////////////////////////////////

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;

var mouse = new THREE.Vector2(), INTERSECTED;

var camera, scene, renderer, effect, projector, raycaster;

var pyramidA, pyramidB, pyramidC, light, lightB, mesh_R_eye, mesh_L_eye;

var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var counter = 0.01;

var materialGray, materialGray, materialGray, materialA, materialLine, materialLineBlack;
var vec_pyramidA_origin, vec_pyramidB_origin, vec_pyramidC_origin;
var locationA, locationB, locationC, dir, acceleration, velocity, targetA, targetB, targetC;
var topspeed = 10.0;
var wireframes = new Array();

var anaglyph = true;

/* 
 * Colors 
 */

var col_bg = 0x999999;
var col_1 = 0xFB875B; // hot orange
var col_2 = 0xE06451; // hot orange
var col_3 = 0xf7666e; // hot orange
var col_4 = 0xE051A1; // hot orange
var col_5 = 0xF75BFB; // hot orange

var col_primary = col_3;

var col_ui_darkest = 0x000000;
var col_ui_darker = 0x1e1e1e; //0x999999
var col_ui_dark = 0x292929;
var col_ui = 0x2e2e2e;
var col_ui_light = 0x999999;
var col_ui_lighter = 0xcccccc;
var col_ui_lightest = 0xffffff;

init();
animate();

function init() {

	container = document.getElementById( 'container' );

	camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 1800;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( col_ui_lighter, 0.0002 );

	light = new THREE.DirectionalLight( col_ui_lightest );
	light.position.set( 0, -1.2, 1 ).normalize();
	scene.add( light );

	lightB = new THREE.DirectionalLight( col_ui_lightest );
	lightB.position.set( 0, -1.2, 1 ).normalize();
	scene.add( lightB );

	lightC = new THREE.DirectionalLight (col_ui_lightest );
	lightC.position.set(vec_pyramidA_origin);
	scene.add( lightC );

	var ambient = new THREE.AmbientLight( col_ui_dark );
	scene.add( ambient );

	// create pyramid material
	materialGray =  new THREE.MeshLambertMaterial( { 
		color: col_ui_lightest,	
		transparent: true, 
		opacity: 0.25 
	} );

	materialA = new THREE.MeshLambertMaterial( { 
		color: col_1, 
		combine: THREE.MixOperation, 
		reflectivity: 1.25,
		transparent: true, 
		opacity: 0.75
	} );

	materialB = new THREE.MeshLambertMaterial( { 
		color: col_3, 
		combine: THREE.MixOperation, 
		reflectivity: 1.25,
		transparent: true, 
		opacity: 0.50 
	} );

	materialC = new THREE.MeshLambertMaterial( { 
		color: col_5, 
		combine: THREE.MixOperation, 
		reflectivity: 1.25,
		transparent: true, 
		opacity: 0.25 
	} );

	materialLine = new THREE.MeshLambertMaterial({
		wireframe: true,
        color: col_ui_lighter
    });

    materialLineBlack = new THREE.MeshLambertMaterial({
		wireframe: true,
        color: col_ui_darkest
    });
	
	vec_pyramidA_origin = new THREE.Vector3(0, 35, 0);
	vec_pyramidB_origin = new THREE.Vector3(0, 45, 0);
	vec_pyramidC_origin = new THREE.Vector3(0, 55, 0);
	locationA = vec_pyramidA_origin;
	locationB = vec_pyramidB_origin;
	loactionC = vec_pyramidC_origin;
	velocity = new THREE.Vector3(0,0,0);
	dir = new THREE.Vector3(0,0,0);
	acceleration = new THREE.Vector3(0,0,0);

	// create a new pyramids
	pyramidA = new THREE.Mesh( 
			new THREE.CylinderGeometry( 0, 20, 40, 4, 1 ), materialA);
	pyramidA.location = vec_pyramidA_origin;
	pyramidA.rotation.x = 0.45;
	scene.add(pyramidA);

	pyramidB = new THREE.Mesh( 
			new THREE.CylinderGeometry( 0, 40, 80, 4, 1 ), materialB);
	pyramidB.location = vec_pyramidB_origin;
	pyramidB.rotation.x = 0.45;
	scene.add(pyramidB);

	pyramidC = new THREE.Mesh( 
			new THREE.CylinderGeometry( 0, 80, 120, 4, 1 ), materialC);
	pyramidC.location = vec_pyramidC_origin;
	pyramidC.rotation.x = 0.45;
	scene.add(pyramidC);

	// wireframes
	for ( var i = 0; i < 50; i ++ ) {

		wireframes[i] = new THREE.Mesh( new THREE.CylinderGeometry( 0, 40, 80, 4, 1 ), materialLine );

	}

	// setup the renderer
	// renderer = new THREE.WebGLRenderer( { antialias: true } );
	// renderer = new THREE.AnaglyphWebGLRenderer();
	// renderer.setFaceCulling( 0 );
	projector = new THREE.Projector();
	raycaster = new THREE.Raycaster();

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setFaceCulling( THREE.CullFaceNone );

	var width = window.innerWidth || 2;
	var height = window.innerHeight || 2;

	effect = new THREE.AnaglyphEffect( renderer );
	effect.setSize( width, height );

	container.appendChild( renderer.domElement );

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	effect.setSize( window.innerWidth, window.innerHeight );

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

	// mouseX = ( event.clientX - windowHalfX );
	// mouseY = ( event.clientY - windowHalfY );

}

//

function animate() {

	requestAnimationFrame( animate );

	render();

}

function onDocumentMouseMove(event) {

	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	

	// pyramidA.

}


function render() {
	// camera.position.x += ( mouseX - camera.position.x ) * 0.05;
	// camera.position.y += ( - mouseY - camera.position.y ) * 0.05;

	// find intersections

	// var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	// projector.unprojectVector( vector, camera );

	// raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

	// var intersects = raycaster.intersectObjects( scene.children );

	// if ( intersects.length > 0 ) {

	// 	if ( INTERSECTED != intersects[ 0 ].object ) {

	// 		if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

	// 		INTERSECTED = intersects[ 0 ].object;
	// 		INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
	// 		INTERSECTED.material.emissive.setHex( col_2 );
	// 	}

	// } else {

	// 	if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

	// 	INTERSECTED = null;

	// }

	if ( pyramidA && pyramidB && pyramidC) {
		
		// rotation
		pyramidA.rotation.y += 0.01;
		pyramidB.rotation.y -= 0.01;
		pyramidC.rotation.y += 0.01;

		if(scrollPos <= 0) {
			pyramidA.position = vec_pyramidA_origin;
			pyramidB.position = vec_pyramidB_origin;
			pyramidC.position = vec_pyramidC_origin;
		}

		var digitalExperiencesMin = 0;
		var digitalExperiencesMax = 800;
		if(scrollPos > digitalExperiencesMin && scrollPos <= digitalExperiencesMax) {
			camera.position.z = map(scrollPos, digitalExperiencesMin, digitalExperiencesMax, 1800, 60);
			
			pyramidA.material = materialA; //materialGray
			pyramidB.material = materialB;
			pyramidC.material = materialC;
		}

		var transitionAMin = 800;
		var transitionAMax = 1000;
		if(scrollPos > transitionAMin && scrollPos <= transitionAMax) {
			camera.position.z = map(scrollPos, transitionAMin, transitionAMax, 60, -600);	
			
			pyramidA.material = materialA;
			pyramidB.material = materialB;
			pyramidC.material = materialC;
		}

		var transitionBMin = 1000;
		var transitionBMax = 1200;
		if(scrollPos > transitionBMin && scrollPos <= transitionBMax) {
			// camera.position.z = map(scrollPos, transitionBMin, transitionBMax, -600, 600);	
			
			pyramidA.material = materialGray;
			pyramidB.material = materialGray;
			pyramidC.material = materialC;
		}

		var designMin = 1200;
		var designMax = 1600;
		if(scrollPos > designMin && scrollPos <= designMax) {
			pyramidA.position.y = map(scrollPos, designMin, designMax, 35, -225);
			pyramidB.position.y = map(scrollPos, designMin, designMax, 45, -75);
			pyramidC.position.y = map(scrollPos, designMin, designMax, 55, 75);	

			pyramidA.material = materialGray;
			pyramidB.material = materialGray;
			pyramidC.material = materialC;
		}

		var experienceMin = 2000;
		var experienceMax = 2600;
		if(scrollPos > experienceMin && scrollPos <= experienceMax) {
			pyramidA.position.y = map(scrollPos, experienceMin, experienceMax, -225, -75); 
			pyramidB.position.y = map(scrollPos, experienceMin, experienceMax, -75, 75);
			pyramidC.position.y = map(scrollPos, experienceMin, experienceMax, 75, 225);	

			pyramidA.material = materialGray;
			pyramidB.material = materialB; // materialB;
			pyramidC.material = materialGray; // materialLine;

			var wireframesDistribution = map(scrollPos, experienceMin, experienceMax, 0, 150);

			// for ( var i = 0; i < wireframes.length; i ++ ) {

			// 	wireframes[i].position.x = ( Math.random() - 0.5 ) * (i*wireframesDistribution);
			// 	wireframes[i].position.y = ( Math.random() - 0.5 ) * (i*wireframesDistribution);
			// 	wireframes[i].position.z = ( Math.random() - 0.5 ) * (i*wireframesDistribution);
			// 	scene.add( wireframes[i] );

			// }
			
		}

		var codeMin = 3000;
		var codeMax = 3600;
		if(scrollPos > codeMin && scrollPos <= codeMax) {
			pyramidA.position.y = map(scrollPos, codeMin, codeMax, -75, 75);
			pyramidB.position.y = map(scrollPos, codeMin, codeMax, 75, 225);
			pyramidC.position.y = map(scrollPos, codeMin, codeMax, 225, 375);

			pyramidA.material = materialA;	
			pyramidB.material = materialGray;
			pyramidC.material = materialGray;

			// meshes[ i ].geometry.faces[ 0 ].materials[ 0 ].color.setHex( 0x0000bb );

			for ( var i = 0; i < wireframes.length; i ++ ) {
				var colorValueR = map(scrollPos, codeMin, codeMax, 204, 0);
				colorValueR = Math.floor(colorValueR);
				console.log("colorValueR: " + colorValueR);
				var colorValueHex = colorValueR.toString(16);
				var colorValue = '0x' + colorValueHex + '' + colorValueHex + '' + colorValueHex;
				console.log(colorValue);

				wireframes[i].material = materialLineBlack;
				// wireframes[i].material.emissive.setHex( 0xff0000 );
				wireframes[i].material.emissive.setHex( colorValue);
				scene.remove( wireframes[i] );

			}
			
		}

		var transitionCMin = 3800;
		var transitionCMax = 4200;
		if(scrollPos > transitionCMin && scrollPos <= transitionCMax) {
			pyramidA.position.y = map(scrollPos, transitionCMin, transitionCMax, 75, 35);
			pyramidB.position.y = map(scrollPos, transitionCMin, transitionCMax, 225, 45);
			pyramidC.position.y = map(scrollPos, transitionCMin, transitionCMax, 375, 55);	

			// pyramidA.rotation.x = map(scrollPos, transitionCMin, transitionCMax, 45, 90);
			// pyramidB.rotation.x = map(scrollPos, transitionCMin, transitionCMax, 45, 90);
			// pyramidC.rotation.x = map(scrollPos, transitionCMin, transitionCMax, 45, 90);	

			// camera.position.z = map(scrollPos, transitionCMin, transitionCMax, -600, 600);	

			pyramidA.material = materialA;
			pyramidB.material = materialB;
			pyramidC.material = materialC;
		}

		var skillsetMin = 4800;
		var skillsetMax = 5200;
		if(scrollPos > skillsetMin && scrollPos <= skillsetMax) {
			if(window.innerWidth > 960) {
				var adjustX = window.innerWidth-960;
				pyramidA.position.x = map(scrollPos, skillsetMin, skillsetMax, 0, -(0+(adjustX/20)));
				pyramidB.position.x = map(scrollPos, skillsetMin, skillsetMax, 0, -(125+(adjustX/20)));
				pyramidC.position.x = map(scrollPos, skillsetMin, skillsetMax, 0, -(300+(adjustX/20)));
			} else {
				pyramidA.position.x = map(scrollPos, skillsetMin, skillsetMax, 0, -0);
				pyramidB.position.x = map(scrollPos, skillsetMin, skillsetMax, 0, -150);
				pyramidC.position.x = map(scrollPos, skillsetMin, skillsetMax, 0, -300);
			}

			camera.position.z = map(scrollPos, skillsetMin, skillsetMax, -600, 600);	

			pyramidA.material = materialA;
			pyramidB.material = materialB;
			pyramidC.material = materialC;
		}

		var transitionDMin = 5800;
		var transitionDMax = 6200;
		if(scrollPos > transitionDMin && scrollPos <= transitionDMax) {
			if(window.innerWidth > 960) {
				var adjustX = window.innerWidth-960;
				pyramidA.position.x = map(scrollPos, transitionDMin, transitionDMax, -(0+(adjustX/20)), 0);
				pyramidB.position.x = map(scrollPos, transitionDMin, transitionDMax, -(125+(adjustX/20)), 0);
				pyramidC.position.x = map(scrollPos, transitionDMin, transitionDMax, -(300+(adjustX/20)), 0);
			} else {
				pyramidA.position.x = map(scrollPos, transitionDMin, transitionDMax, -0, 0);
				pyramidB.position.x = map(scrollPos, transitionDMin, transitionDMax, -150, 0);
				pyramidC.position.x = map(scrollPos, transitionDMin, transitionDMax, -300, 0);
			}

			// camera.position.z = map(scrollPos, transitionDMin, transitionDMax, -600, 600);	

			pyramidA.material = materialA;
			pyramidB.material = materialB;
			pyramidC.material = materialC;
		}

		var transitionEMin = 6800;
		var transitionEMax = 7200;
		if(scrollPos > transitionEMin && scrollPos <= transitionEMax) {

			camera.position.z = map(scrollPos, transitionEMin, transitionEMax, 600, 60);	

			pyramidA.material = materialA;
			pyramidB.material = materialB;
			pyramidC.material = materialC;
		}


		var transitionFMin = 7800;
		var transitionFMax = 8200;
		if(scrollPos > transitionFMin && scrollPos <= transitionFMax) {

			camera.position.z = map(scrollPos, transitionFMin, transitionFMax, 60, 10);	
			camera.position.y = map(scrollPos, transitionFMin, transitionFMax, 0, 45);	

			pyramidA.material = materialA;
			pyramidB.material = materialB;
			pyramidC.material = materialC;
		}


		$('.cameraz').text(camera.position.z);


	}		

	if ( light ) {
		light.position.x = 2000 * Math.cos( counter );
		// light.position.y += ( - mouseY - camera.position.y ) * .05;
		light.position.z = 2000 * Math.sin( counter );					

		// light.position.y = 0 - 0.75*Math.sin(counter);
		counter += 0.05;
	}		

	// camera.position.x = 1000 * Math.cos( timer );
	// camera.position.y += ( - mouseY - camera.position.y ) * .05;
	// camera.position.z = 1000 * Math.sin( timer );

	camera.lookAt( scene.position );

	if(anaglyph) {
		effect.render( scene, camera );	
	} else {
		renderer.render( scene, camera );
	}

}

function nav_next() {
	if(scrollPos < 800) { $.scrollTo(800, 2000); }	
	if(scrollPos >= 800 && scrollPos < 1800) { $.scrollTo(1800, 2000); }
	if(scrollPos >= 1800 && scrollPos < 2800) { $.scrollTo(2800, 2000); }
	if(scrollPos >= 2800 && scrollPos < 3800) { $.scrollTo(3800, 2000); }
	if(scrollPos >= 3800 && scrollPos < 4800) { $.scrollTo(4800, 2000); }
	if(scrollPos >= 4800 && scrollPos < 5800) { $.scrollTo(5800, 2000); }
	if(scrollPos >= 5800 && scrollPos < 10000) { $.scrollTo(10000, 5000); }		
}

function nav_prev() {
	if(scrollPos <= 800) { $.scrollTo(0, 2000); }		
	if(scrollPos > 800 && scrollPos <= 1800) { $.scrollTo(800, 2000); }	
	if(scrollPos > 1800 && scrollPos <= 2800) { $.scrollTo(1800, 2000); }	
	if(scrollPos > 2800 && scrollPos <= 3800) { $.scrollTo(2800, 2000); }	
	if(scrollPos > 3800 && scrollPos <= 4800) { $.scrollTo(3800, 2000); }		
	if(scrollPos > 4800 && scrollPos <= 5800) { $.scrollTo(4800, 2000); }		
	if(scrollPos > 5800) { $.scrollTo(5800, 2000); }		
}

function map(value, originalMin, originalMax, targetMin, targetMax) {
	var returnValue = targetMin + ((value-originalMin) / (originalMax-originalMin) * (targetMax-targetMin));
	return returnValue;
}

function anaglyph_toggle() {
	if(anaglyph) {
		anaglyph = false;
	} else {
		anaglyph = true;
	}
	$('.anaglyph_toggle a').toggleClass('strikethrough');
}


