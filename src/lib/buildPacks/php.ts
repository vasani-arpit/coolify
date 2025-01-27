import { buildImage } from '$lib/docker';
import { promises as fs } from 'fs';

const createDockerfile = async (data, image, htaccessFound): Promise<void> => {
	const { workdir, baseDirectory, buildId, port } = data;
	const Dockerfile: Array<string> = [];
	let composerFound = false;
	try {
		await fs.readFile(`${workdir}${baseDirectory || ''}/composer.json`);
		composerFound = true;
	} catch (error) {}

	Dockerfile.push(`FROM ${image}`);
	Dockerfile.push(`LABEL coolify.buildId=${buildId}`);
	Dockerfile.push('WORKDIR /app');
	Dockerfile.push(`COPY .${baseDirectory || ''} /app`);
	if (htaccessFound) {
		Dockerfile.push(`COPY .${baseDirectory || ''}/.htaccess ./`);
	}
	if (composerFound) {
		Dockerfile.push(`RUN composer install`);
	}

	Dockerfile.push(`COPY /entrypoint.sh /opt/docker/provision/entrypoint.d/30-entrypoint.sh`);
	Dockerfile.push(`EXPOSE ${port}`);
	await fs.writeFile(`${workdir}/Dockerfile`, Dockerfile.join('\n'));
};

export default async function (data) {
	const { workdir, baseDirectory, baseImage } = data;
	try {
		let htaccessFound = false;
		try {
			await fs.readFile(`${workdir}${baseDirectory || ''}/.htaccess`);
			htaccessFound = true;
		} catch (e) {
			//
		}
		await createDockerfile(data, baseImage, htaccessFound);
		await buildImage(data);
	} catch (error) {
		throw error;
	}
}
