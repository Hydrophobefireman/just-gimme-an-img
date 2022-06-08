import "file-drop-element";
import "prismjs/themes/prism-okaidia.css";

import "./style.css";

import Prism from "prismjs";

import {App, ImageTask} from "./lib/app";
import {applyTemplate} from "./lib/applyTemplate";
import {
  getCLIOptionsFromMimeType,
  getCodecFromMimeType,
  getConversionStrategyForInput,
  getExtensionFromMimeType,
  getMimeTypeFromStrategy,
} from "./lib/mime-utils";
import {basename, extname} from "./utils";

let app = new App();

const onSaveAll = async (e) => {
  if (app.state.images.length == 0) {
    alert("Please encode some images");
    return;
  }

  if ("showDirectoryPicker" in window === false) {
    alert(
      "This feature only works in a browser that supports the File System API."
    );
    return;
  }

  try {
    const directoryHandle = await window.showDirectoryPicker();
    if (directoryHandle !== undefined) {
      for (let image of allImages) {
        const file = await directoryHandle.getFileHandle(image.name, {
          create: true,
        });
        const writable = await file.createWritable();
        await image.stream().pipeTo(writable);
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const onFile = (e) => {
  const file = (e.target?.files || e.files)[0];

  const {state, optimizer} = app;

  state.fileName = file.name;
  state.images.length = 0;
  state.running = false;

  goButton.disabled = false;

  optimizer.load(file).then(() => {
    state.images.length = 0;
    // create the images we need to populate.
    for (let [width, height] of optimizer.optimalSizes) {
      state.images.push(new ImageTask(width, height));
    }

    render();
  });
};

const onGoClicked = async (e) => {
  const {
    optimizer,
    optimizer: {file},
    state,
  } = app;

  state.running = true;

  // We have to load the image to get the width and height.
  const [sourceElementStrategy, imgElementStrategy] =
    getConversionStrategyForInput(file.type);

  const sourceElementMimeType = getMimeTypeFromStrategy(sourceElementStrategy);
  const imgElementMimeType = getMimeTypeFromStrategy(imgElementStrategy);

  await compressAndOutputImages(sourceElementMimeType);
  await compressAndOutputImages(imgElementMimeType);

  state.running = false;
};

const onFileNameChanged = (e) => {
  app.state.fileName = e.target.value;
  render();
};

const onBasePathChanged = (e) => {
  app.state.basePath = e.target.value;
  render();
};

const render = () => {
  const {state, optimizer} = app;
  const {type} = optimizer.metadata;

  let root = document.documentElement;
  root.style.setProperty("--filename", `'${state.fileName}'`);

  const [sourceElementStrategy, imgElementStrategy] =
    getConversionStrategyForInput(type);

  const sourceElementMimeType = getMimeTypeFromStrategy(sourceElementStrategy);
  const imgElementMimeType = getMimeTypeFromStrategy(imgElementStrategy);

  updateCLI(sourceElementStrategy, imgElementStrategy);
  updateHTML(sourceElementMimeType, imgElementMimeType);

  Prism.highlightAll();

  const rootOutputElement = document.getElementById("image-output");
  rootOutputElement.innerHTML = "";

  renderOriginal(rootOutputElement);

  updateWorklistUI(rootOutputElement, sourceElementMimeType);
  updateWorklistUI(rootOutputElement, imgElementMimeType);
};

fileSelect.addEventListener("change", onFile);
imageDrop.addEventListener("filedrop", onFile);
goButton.addEventListener("click", onGoClicked);
saveAllButton.addEventListener("click", onSaveAll);
fileName.addEventListener("change", onFileNameChanged);
filePath.addEventListener("change", onBasePathChanged);

Prism.hooks.add("before-highlight", function (env) {
  env.code = env.element.innerText;
});

const updateHTML = (sourceElementMimeType, imgElementMimeType) => {
  const sizes = app.optimizer.optimalSizes;
  const {naturalHeight, naturalWidth} = app.optimizer.metadata;
  const name = app.state.fileName;
  const extension = extname(name);
  const nameNoExtension = basename(name, extension);

  const sourceExtension = getExtensionFromMimeType(sourceElementMimeType);
  const imgExtension = getExtensionFromMimeType(imgElementMimeType).replace(
    "jpeg",
    "jpg"
  );

  let imports = `
    import orig from "./${nameNoExtension}.${imgExtension}";
    
    ${sizes
      .map(([width]) =>
        `
    import img_${width}_${imgExtension} from "./${nameNoExtension}-${width}.${imgExtension}";    
    import img_${width}_${sourceExtension} from "./${nameNoExtension}-${width}.${sourceExtension}";
    `.trim()
      )
      .join("\n")}

  `;
  let sources = `
  <source 
    type="${sourceElementMimeType}"
    sizes="100vw"
    srcset={\`${sizes
      .map(([width]) =>
        ` 
   \${img_${width}_${sourceExtension}}  ${width}w`.trim()
      )
      .join(", \n\t\t")}
    \`}/>`;

  code.innerText = `
${imports}
import {css} from "catom"

export function I() {

return   <picture>
      ${sources}
      <img 
        alt="The author should add a description of what appears in the image."
        src={orig} 
        class={css({borderRadius:"20px"})}
        srcset={\`${sizes
          .map(([width]) => `\${img_${width}_${imgExtension}} ${width}w`)
          .join(", \n\t\t")}\`}
        sizes="100vw"
        loading="lazy"
        //@ts-ignore
        decoding="async"
        height="${naturalHeight}"
        width="${naturalWidth}"
        style="content-visibility: auto; max-width: 100%; height: auto;"/>
</picture>
        }
`;
};

const updateCLI = (targetBaseCodec, targetSourceCodec) => {
  const sizes = app.optimizer.optimalSizes;
  const name = app.optimizer.metadata.name;

  let cliCommands = [
    `npx @squoosh/cli --${targetSourceCodec} '{"quality":75}' ${name
      .split(" ")
      .join("\\ ")}`,
  ].concat(
    sizes.map(
      ([width, height]) =>
        `npx @squoosh/cli --resize "{width: ${width}, height: ${height}}" --${targetSourceCodec} auto -s \-${width} ${name
          .split(" ")
          .join("\\ ")}`
    )
  );

  cliCommands.push(
    ...sizes.map(
      ([width, height]) =>
        `npx @squoosh/cli --resize "{width: ${width}, height: ${height}}" --${targetBaseCodec} auto -s \-${width} ${name
          .split(" ")
          .join("\\ ")}`
    )
  );
  cli.innerText = cliCommands.join(" && \n  ");
};

const renderOriginal = (rootElement) => {
  const {file, metadata} = app.optimizer;
  const {name} = file;

  rootElement.appendChild(
    applyTemplate(codecOutputTemplate, {
      codec: "original",
      id: `original-output`,
    })
  );

  const outputElement = document.getElementById(`original-output`);

  outputElement.appendChild(
    applyTemplate(previewListItemTemplate, {
      name: `${name}`,
      url: URL.createObjectURL(file),
      width: metadata.naturalWidth,
      height: metadata.naturalHeight,
      status: "original",
      size: `${(file.size / 1024).toFixed(2)} KB`,
    })
  );
};

function updateWorklistUI(rootElement, mimeType) {
  const {fileName, images} = app.state;
  const extension = getExtensionFromMimeType(mimeType);

  rootElement.appendChild(
    applyTemplate(codecOutputTemplate, {
      codec: getCodecFromMimeType(mimeType),
      id: `${getCodecFromMimeType(mimeType)}-output`,
    })
  );

  const outputElement = document.getElementById(
    `${getCodecFromMimeType(mimeType)}-output`
  );

  for (let image of images) {
    const {width, height, url, size} = image;
    outputElement.appendChild(
      applyTemplate(previewListItemTemplate, {
        name: `${basename(fileName, extname(fileName))}-${width}.${extension}`,
        width,
        height,
        url,
        status: url ? "done" : "not-started",
        size: size == 0 ? "Unknown Size" : `${(size / 1024).toFixed(2)} KB`,
      })
    );
  }
}

async function compressAndOutputImages(mimeType) {
  const {
    optimizer,
    state: {images, fileName},
  } = app;
  const extension = getExtensionFromMimeType(mimeType);
  const cliOptions = getCLIOptionsFromMimeType(mimeType);

  for (let image of images) {
    cliOptions["resize"] = {width: image.width, height: image.height};

    const elementToUpdate = document.getElementById(
      `${basename(fileName, extname(fileName))}-${image.width}.${extension}`
    );

    elementToUpdate.classList.add("working");

    const results = await optimizer.optimize(cliOptions);

    for (let file of results.values()) {
      const outputFile = file.outputs[0];
      const newName = `${basename(fileName, extname(fileName))}-${
        image.width
      }.${extension}`;
      const output = new File([file.outputs[0].out.buffer], newName, {
        type: mimeType,
      });

      image.compressedImage = output;
      image.size = outputFile.outputSize;

      render();
    }
  }
}
